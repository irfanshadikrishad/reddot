import CryptoJS from 'crypto-js'
import * as Crypto from 'expo-crypto'

import { getLocalDatabase } from '@/services/localDatabase'
import { getOrCreateJournalKey } from '@/services/secureStorage'
import {
  JournalEntry,
  JournalEntryInput,
  JournalTimelineFilter,
  RepositoryResult,
} from '@/types'

interface JournalRow {
  id: string
  encrypted_payload: string
  created_at: number
  updated_at: number
}

interface JournalEnvelope {
  version: 1
  iv: string
  ciphertext: string
  mac: string
}

const JOURNAL_ID_PREFIX = 'journal'

function databaseError(message: string): RepositoryResult<never> {
  return {
    ok: false,
    error: {
      code: 'database_unavailable',
      message,
    },
  }
}

function invalidDataError(message: string): RepositoryResult<never> {
  return {
    ok: false,
    error: {
      code: 'invalid_data',
      message,
    },
  }
}

function notFoundError(message: string): RepositoryResult<never> {
  return {
    ok: false,
    error: {
      code: 'not_found',
      message,
    },
  }
}

function bytesToWordArray(bytes: Uint8Array): CryptoJS.lib.WordArray {
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return CryptoJS.enc.Hex.parse(hex)
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false

  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

function deriveKeys(masterKey: string) {
  const master = CryptoJS.enc.Hex.parse(masterKey)
  return {
    encryptionKey: CryptoJS.HmacSHA256('reddot-journal-encryption-v1', master),
    macKey: CryptoJS.HmacSHA256('reddot-journal-authentication-v1', master),
  }
}

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const tag of tags) {
    const trimmed = tag.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    normalized.push(trimmed)
  }

  return normalized
}

function normalizeMood(value?: JournalEntryInput['mood']): JournalEntry['mood'] {
  if (
    value === 'safe' ||
    value === 'anxious' ||
    value === 'scared' ||
    value === 'hopeful' ||
    value === 'neutral'
  ) {
    return value
  }
  return undefined
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isJournalMedia(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const media = value as Partial<JournalEntry['mediaUrls'][number]>
  return (
    typeof media.id === 'string' &&
    (media.type === 'photo' || media.type === 'video' || media.type === 'audio') &&
    typeof media.url === 'string' &&
    typeof media.createdAt === 'number' &&
    (typeof media.thumbnail === 'string' || typeof media.thumbnail === 'undefined')
  )
}

function isJournalEntry(value: unknown): value is JournalEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<JournalEntry>
  return (
    typeof entry.id === 'string' &&
    typeof entry.uid === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.content === 'string' &&
    Array.isArray(entry.mediaUrls) && entry.mediaUrls.every(isJournalMedia) &&
    (entry.mood === undefined ||
      entry.mood === 'safe' ||
      entry.mood === 'anxious' ||
      entry.mood === 'scared' ||
      entry.mood === 'hopeful' ||
      entry.mood === 'neutral') &&
    isStringArray(entry.tags) &&
    typeof entry.createdAt === 'number' &&
    typeof entry.updatedAt === 'number' &&
    entry.isEncrypted === true
  )
}

function buildJournalEntry(
  input: JournalEntryInput,
  id: string,
  createdAt: number
): JournalEntry {
  const title = input.title.trim()
  return {
    id,
    uid: input.uid.trim() || 'local',
    title: title.length > 0 ? title : 'Untitled entry',
    content: input.content,
    mediaUrls: [],
    mood: normalizeMood(input.mood),
    tags: normalizeTags(input.tags),
    createdAt,
    updatedAt: Date.now(),
    isEncrypted: true,
  }
}

async function createJournalId(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(8)
  const randomPart = Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return JOURNAL_ID_PREFIX + '_' + Date.now().toString(16) + '_' + randomPart
}

async function encryptJournalPayload<T>(value: T): Promise<string | null> {
  try {
    const masterKey = await getOrCreateJournalKey()
    if (!masterKey) return null

    const { encryptionKey, macKey } = deriveKeys(masterKey)
    const iv = bytesToWordArray(await Crypto.getRandomBytesAsync(16))
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(value), encryptionKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    const ivBase64 = CryptoJS.enc.Base64.stringify(iv)
    const ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Base64)
    const authenticatedData = '1.' + ivBase64 + '.' + ciphertext
    const mac = CryptoJS.HmacSHA256(authenticatedData, macKey).toString(
      CryptoJS.enc.Hex
    )

    return JSON.stringify({
      version: 1,
      iv: ivBase64,
      ciphertext,
      mac,
    } satisfies JournalEnvelope)
  } catch {
    return null
  }
}

async function decryptJournalPayload<T>(
  payload: string
): Promise<RepositoryResult<T>> {
  try {
    const masterKey = await getOrCreateJournalKey()
    if (!masterKey) {
      return {
        ok: false,
        error: {
          code: 'encryption_unavailable',
          message: 'The journal could not be opened securely.',
        },
      }
    }

    const envelope = JSON.parse(payload) as Partial<JournalEnvelope>
    if (
      envelope.version !== 1 ||
      typeof envelope.iv !== 'string' ||
      typeof envelope.ciphertext !== 'string' ||
      typeof envelope.mac !== 'string'
    ) {
      return invalidDataError('A journal entry could not be read safely.')
    }

    const { encryptionKey, macKey } = deriveKeys(masterKey)
    const authenticatedData = '1.' + envelope.iv + '.' + envelope.ciphertext
    const expectedMac = CryptoJS.HmacSHA256(authenticatedData, macKey).toString(
      CryptoJS.enc.Hex
    )
    if (!constantTimeEqual(envelope.mac, expectedMac)) {
      return invalidDataError('A journal entry could not be read safely.')
    }

    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(envelope.ciphertext),
    })
    const decrypted = CryptoJS.AES.decrypt(cipherParams, encryptionKey, {
      iv: CryptoJS.enc.Base64.parse(envelope.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8)
    if (!plaintext) {
      return invalidDataError('A journal entry could not be read safely.')
    }

    const parsed = JSON.parse(plaintext) as T
    return { ok: true, value: parsed }
  } catch {
    return invalidDataError('A journal entry could not be read safely.')
  }
}

async function readJournalEntry(row: JournalRow): Promise<RepositoryResult<JournalEntry>> {
  const decrypted = await decryptJournalPayload<JournalEntry>(row.encrypted_payload)
  if (!decrypted.ok || !isJournalEntry(decrypted.value)) {
    return invalidDataError('A journal entry could not be read safely.')
  }

  return { ok: true, value: decrypted.value }
}

function timelineWindow(filter: JournalTimelineFilter): {
  startAt: number | null
  endAt: number | null
} {
  if (filter === 'all') {
    return { startAt: null, endAt: null }
  }

  const days = filter === '7d' ? 7 : filter === '30d' ? 30 : 90
  const endAt = Date.now()
  const startAt = endAt - days * 24 * 60 * 60 * 1000
  return { startAt, endAt }
}

export async function getJournalEntries(
  filter: JournalTimelineFilter = 'all'
): Promise<RepositoryResult<JournalEntry[]>> {
  try {
    const database = await getLocalDatabase()
    const window = timelineWindow(filter)
    const rows =
      window.startAt === null || window.endAt === null
        ? await database.getAllAsync<JournalRow>(
            'SELECT id, encrypted_payload, created_at, updated_at FROM journal_entries ORDER BY updated_at DESC'
          )
        : await database.getAllAsync<JournalRow>(
            'SELECT id, encrypted_payload, created_at, updated_at FROM journal_entries WHERE created_at BETWEEN ? AND ? ORDER BY updated_at DESC',
            window.startAt,
            window.endAt
          )

    const entries: JournalEntry[] = []
    for (const row of rows) {
      const entry = await readJournalEntry(row)
      if (!entry.ok) return entry
      entries.push(entry.value)
    }

    return {
      ok: true,
      value: entries.sort((left, right) => right.updatedAt - left.updatedAt),
    }
  } catch {
    return databaseError('Local journal entries are unavailable. Please try again.')
  }
}

export async function getJournalEntry(
  entryId: string
): Promise<RepositoryResult<JournalEntry>> {
  try {
    const database = await getLocalDatabase()
    const row = await database.getFirstAsync<JournalRow>(
      'SELECT id, encrypted_payload, created_at, updated_at FROM journal_entries WHERE id = ?',
      entryId
    )
    if (!row) {
      return notFoundError('That journal entry could not be found.')
    }

    return readJournalEntry(row)
  } catch {
    return databaseError('Local journal entries are unavailable. Please try again.')
  }
}

export async function saveJournalEntry(
  input: JournalEntryInput,
  entryId?: string
): Promise<RepositoryResult<JournalEntry>> {
  try {
    const database = await getLocalDatabase()
    const existingRow = entryId
      ? await database.getFirstAsync<JournalRow>(
          'SELECT id, encrypted_payload, created_at, updated_at FROM journal_entries WHERE id = ?',
          entryId
        )
      : null

    if (entryId && !existingRow) {
      return notFoundError('That journal entry could not be found.')
    }

    const entry = buildJournalEntry(
      input,
      entryId ?? (await createJournalId()),
      existingRow?.created_at ?? Date.now()
    )
    const encrypted = await encryptJournalPayload(entry)
    if (!encrypted) {
      return {
        ok: false,
        error: {
          code: 'encryption_unavailable',
          message: 'The journal entry could not be encrypted and was not saved.',
        },
      }
    }

    await database.runAsync(
      'INSERT INTO journal_entries (id, encrypted_payload, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET encrypted_payload = excluded.encrypted_payload, updated_at = excluded.updated_at',
      entry.id,
      encrypted,
      entry.createdAt,
      entry.updatedAt
    )

    return { ok: true, value: entry }
  } catch {
    return {
      ok: false,
      error: {
        code: 'write_failed',
        message: 'The journal entry was not saved. Please try again.',
      },
    }
  }
}

export async function deleteJournalEntry(
  entryId: string
): Promise<RepositoryResult<void>> {
  try {
    const database = await getLocalDatabase()
    await database.runAsync('DELETE FROM journal_entries WHERE id = ?', entryId)
    return { ok: true, value: undefined }
  } catch {
    return databaseError('Local journal entries are unavailable. Please try again.')
  }
}
