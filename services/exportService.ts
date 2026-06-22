import CryptoJS from 'crypto-js'
import * as Crypto from 'expo-crypto'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'

import { replaceSafetyPlan } from '@/services/safetyPlanRepository'
import { RepositoryResult, SafetyPlan } from '@/types'

interface SafetyPlanBackupEnvelope {
  version: 1
  kind: 'reddot_safety_plan_backup'
  salt: string
  iv: string
  ciphertext: string
  mac: string
}

const BACKUP_ITERATIONS = 25000
const BACKUP_ERROR = 'The safety plan backup could not be processed.'

function bytesToWordArray(bytes: Uint8Array): CryptoJS.lib.WordArray {
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return CryptoJS.enc.Hex.parse(hex)
}

function wordArrayToBase64(wordArray: CryptoJS.lib.WordArray): string {
  return CryptoJS.enc.Base64.stringify(wordArray)
}

function base64ToWordArray(value: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Base64.parse(value)
}

function deriveKey(passphrase: string, salt: string, purpose: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(`${passphrase}:${purpose}`, base64ToWordArray(salt), {
    keySize: 256 / 32,
    iterations: BACKUP_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  })
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

function validatePlan(value: unknown): value is SafetyPlan {
  if (!value || typeof value !== 'object') return false
  const plan = value as Partial<SafetyPlan>
  return (
    typeof plan.id === 'string' &&
    typeof plan.uid === 'string' &&
    Array.isArray(plan.triggerSigns) &&
    Array.isArray(plan.safePersons) &&
    Array.isArray(plan.safeLocations) &&
    Array.isArray(plan.importantDocuments) &&
    Array.isArray(plan.exitSteps) &&
    Array.isArray(plan.escapeBagItems) &&
    (typeof plan.codeWord === 'string' || typeof plan.codeWord === 'undefined') &&
    Array.isArray(plan.localResources) &&
    typeof plan.updatedAt === 'number'
  )
}

function buildEnvelope(plan: SafetyPlan, passphrase: string): Promise<SafetyPlanBackupEnvelope | null> {
  return (async () => {
    const salt = wordArrayToBase64(bytesToWordArray(await Crypto.getRandomBytesAsync(16)))
    const iv = wordArrayToBase64(bytesToWordArray(await Crypto.getRandomBytesAsync(16)))
    const encryptionKey = deriveKey(passphrase, salt, 'encryption')
    const macKey = deriveKey(passphrase, salt, 'mac')
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(plan), encryptionKey, {
      iv: base64ToWordArray(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    const ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Base64)
    const authenticatedData = `1.${salt}.${iv}.${ciphertext}`
    const mac = CryptoJS.HmacSHA256(authenticatedData, macKey).toString(
      CryptoJS.enc.Hex
    )

    return {
      version: 1,
      kind: 'reddot_safety_plan_backup',
      salt,
      iv,
      ciphertext,
      mac,
    }
  })()
}

export async function createSafetyPlanBackup(
  plan: SafetyPlan,
  passphrase: string
): Promise<RepositoryResult<string>> {
  if (!passphrase.trim()) {
    return {
      ok: false,
      error: {
        code: 'invalid_data',
        message: 'Enter a backup passphrase first.',
      },
    }
  }

  try {
    const envelope = await buildEnvelope(plan, passphrase)
    if (!envelope) {
      return {
        ok: false,
        error: {
          code: 'encryption_unavailable',
          message: BACKUP_ERROR,
        },
      }
    }
    return { ok: true, value: JSON.stringify(envelope, null, 2) }
  } catch {
    return {
      ok: false,
      error: {
        code: 'encryption_unavailable',
        message: BACKUP_ERROR,
      },
    }
  }
}

function parseBackup(serialized: string):
  | { ok: true; value: SafetyPlanBackupEnvelope }
  | { ok: false } {
  try {
    const parsed = JSON.parse(serialized) as Partial<SafetyPlanBackupEnvelope>
    if (
      parsed.version !== 1 ||
      parsed.kind !== 'reddot_safety_plan_backup' ||
      typeof parsed.salt !== 'string' ||
      typeof parsed.iv !== 'string' ||
      typeof parsed.ciphertext !== 'string' ||
      typeof parsed.mac !== 'string'
    ) {
      return { ok: false }
    }
    return { ok: true, value: parsed as SafetyPlanBackupEnvelope }
  } catch {
    return { ok: false }
  }
}

async function decryptBackup(
  envelope: SafetyPlanBackupEnvelope,
  passphrase: string
): Promise<RepositoryResult<SafetyPlan>> {
  const encryptionKey = deriveKey(passphrase, envelope.salt, 'encryption')
  const macKey = deriveKey(passphrase, envelope.salt, 'mac')
  const authenticatedData = `1.${envelope.salt}.${envelope.iv}.${envelope.ciphertext}`
  const expectedMac = CryptoJS.HmacSHA256(authenticatedData, macKey).toString(
    CryptoJS.enc.Hex
  )
  if (!constantTimeEqual(envelope.mac, expectedMac)) {
    return {
      ok: false,
      error: {
        code: 'invalid_data',
        message: 'The backup passphrase or file is incorrect.',
      },
    }
  }

  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Base64.parse(envelope.ciphertext),
  })
  const decrypted = CryptoJS.AES.decrypt(cipherParams, encryptionKey, {
    iv: base64ToWordArray(envelope.iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  const plaintext = decrypted.toString(CryptoJS.enc.Utf8)
  if (!plaintext) {
    return {
      ok: false,
      error: {
        code: 'invalid_data',
        message: 'The backup passphrase or file is incorrect.',
      },
    }
  }

  try {
    const plan = JSON.parse(plaintext) as unknown
    if (!validatePlan(plan)) {
      return {
        ok: false,
        error: {
          code: 'invalid_data',
          message: 'The backup file is not a valid safety plan.',
        },
      }
    }
    return { ok: true, value: plan }
  } catch {
    return {
      ok: false,
      error: {
        code: 'invalid_data',
        message: 'The backup file is not a valid safety plan.',
      },
    }
  }
}

export async function restoreSafetyPlanBackup(
  serialized: string,
  passphrase: string
): Promise<RepositoryResult<SafetyPlan>> {
  if (!passphrase.trim()) {
    return {
      ok: false,
      error: {
        code: 'invalid_data',
        message: 'Enter the backup passphrase first.',
      },
    }
  }

  const parsed = parseBackup(serialized)
  if (!parsed.ok) {
    return {
      ok: false,
      error: {
        code: 'invalid_data',
        message: 'The backup file is not a valid safety plan.',
      },
    }
  }

  const decrypted = await decryptBackup(parsed.value, passphrase)
  if (!decrypted.ok) return decrypted

  const saved = await replaceSafetyPlan(decrypted.value)
  if (!saved.ok) return saved
  return { ok: true, value: saved.value }
}

export async function restoreSafetyPlanBackupFromFile(
  passphrase: string
): Promise<RepositoryResult<SafetyPlan>> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/json', 'text/plain'],
      copyToCacheDirectory: true,
      multiple: false,
    })
    if (result.canceled || !result.assets.length) {
      return {
        ok: false,
        error: {
          code: 'invalid_data',
          message: 'Backup import was cancelled.',
        },
      }
    }

    const file = result.assets[0]
    const contents = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    })
    return restoreSafetyPlanBackup(contents, passphrase)
  } catch {
    return {
      ok: false,
      error: {
        code: 'database_unavailable',
        message: BACKUP_ERROR,
      },
    }
  }
}
