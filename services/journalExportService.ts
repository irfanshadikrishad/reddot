import CryptoJS from 'crypto-js'
import * as Crypto from 'expo-crypto'

import { JournalEntry, RepositoryResult } from '@/types'

interface JournalBackupEnvelope {
  version: 1
  kind: 'reddot_journal_backup'
  salt: string
  iv: string
  ciphertext: string
  mac: string
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

function deriveKeys(passphrase: string, salt: string) {
  const base = CryptoJS.PBKDF2(passphrase, CryptoJS.enc.Base64.parse(salt), {
    keySize: 512 / 32,
    iterations: 20000,
    hasher: CryptoJS.algo.SHA512,
  })

  return {
    encryptionKey: CryptoJS.HmacSHA256('reddot-journal-export-v1', base),
    macKey: CryptoJS.HmacSHA256('reddot-journal-export-auth-v1', base),
  }
}

export async function createJournalBackup(
  entries: JournalEntry[],
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
    const salt = CryptoJS.enc.Base64.stringify(
      bytesToWordArray(await Crypto.getRandomBytesAsync(16))
    )
    const iv = CryptoJS.enc.Base64.stringify(
      bytesToWordArray(await Crypto.getRandomBytesAsync(16))
    )
    const { encryptionKey, macKey } = deriveKeys(passphrase.trim(), salt)
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(entries), encryptionKey, {
      iv: CryptoJS.enc.Base64.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    const ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Base64)
    const authenticatedData = '1.' + salt + '.' + iv + '.' + ciphertext
    const mac = CryptoJS.HmacSHA256(authenticatedData, macKey).toString(
      CryptoJS.enc.Hex
    )

    return {
      ok: true,
      value: JSON.stringify({
        version: 1,
        kind: 'reddot_journal_backup',
        salt,
        iv,
        ciphertext,
        mac,
      } satisfies JournalBackupEnvelope),
    }
  } catch {
    return {
      ok: false,
      error: {
        code: 'write_failed',
        message: 'The journal export could not be prepared.',
      },
    }
  }
}

export async function restoreJournalBackup(
  backup: string,
  passphrase: string
): Promise<RepositoryResult<JournalEntry[]>> {
  try {
    const envelope = JSON.parse(backup) as Partial<JournalBackupEnvelope>
    if (
      envelope.version !== 1 ||
      envelope.kind !== 'reddot_journal_backup' ||
      typeof envelope.salt !== 'string' ||
      typeof envelope.iv !== 'string' ||
      typeof envelope.ciphertext !== 'string' ||
      typeof envelope.mac !== 'string'
    ) {
      return {
        ok: false,
        error: {
          code: 'invalid_data',
          message: 'The journal export could not be validated.',
        },
      }
    }

    const { encryptionKey, macKey } = deriveKeys(passphrase.trim(), envelope.salt)
    const authenticatedData =
      '1.' + envelope.salt + '.' + envelope.iv + '.' + envelope.ciphertext
    const expectedMac = CryptoJS.HmacSHA256(authenticatedData, macKey).toString(
      CryptoJS.enc.Hex
    )
    if (!constantTimeEqual(envelope.mac, expectedMac)) {
      return {
        ok: false,
        error: {
          code: 'invalid_data',
          message: 'The journal export could not be opened with that passphrase.',
        },
      }
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
      return {
        ok: false,
        error: {
          code: 'invalid_data',
          message: 'The journal export could not be opened with that passphrase.',
        },
      }
    }

    const entries = JSON.parse(plaintext) as JournalEntry[]
    if (!Array.isArray(entries)) {
      return {
        ok: false,
        error: {
          code: 'invalid_data',
          message: 'The journal export could not be validated.',
        },
      }
    }

    return { ok: true, value: entries }
  } catch {
    return {
      ok: false,
      error: {
        code: 'invalid_data',
        message: 'The journal export could not be validated.',
      },
    }
  }
}
