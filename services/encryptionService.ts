import CryptoJS from 'crypto-js'
import * as Crypto from 'expo-crypto'

import { getOrCreateLocalDataKey } from '@/services/secureStorage'

interface EncryptedEnvelope {
  version: 1
  iv: string
  ciphertext: string
  mac: string
}

export type DecryptionResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'key_unavailable' | 'invalid_payload' }

function bytesToWordArray(bytes: Uint8Array): CryptoJS.lib.WordArray {
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return CryptoJS.enc.Hex.parse(hex)
}

function deriveKeys(masterKey: string) {
  const master = CryptoJS.enc.Hex.parse(masterKey)
  return {
    encryptionKey: CryptoJS.HmacSHA256('reddot-encryption-v1', master),
    macKey: CryptoJS.HmacSHA256('reddot-authentication-v1', master),
  }
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false

  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

export async function encryptLocalPayload<T>(value: T): Promise<string | null> {
  try {
    const masterKey = await getOrCreateLocalDataKey()
    if (!masterKey) return null

    const { encryptionKey, macKey } = deriveKeys(masterKey)
    const iv = bytesToWordArray(await Crypto.getRandomBytesAsync(16))
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(value),
      encryptionKey,
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    )
    const ivBase64 = CryptoJS.enc.Base64.stringify(iv)
    const ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Base64)
    const authenticatedData = `1.${ivBase64}.${ciphertext}`
    const mac = CryptoJS.HmacSHA256(authenticatedData, macKey).toString(
      CryptoJS.enc.Hex
    )

    return JSON.stringify({
      version: 1,
      iv: ivBase64,
      ciphertext,
      mac,
    } satisfies EncryptedEnvelope)
  } catch {
    return null
  }
}

export async function decryptLocalPayload<T>(
  payload: string
): Promise<DecryptionResult<T>> {
  try {
    const masterKey = await getOrCreateLocalDataKey()
    if (!masterKey) return { ok: false, reason: 'key_unavailable' }

    const envelope = JSON.parse(payload) as Partial<EncryptedEnvelope>
    if (
      envelope.version !== 1 ||
      typeof envelope.iv !== 'string' ||
      typeof envelope.ciphertext !== 'string' ||
      typeof envelope.mac !== 'string'
    ) {
      return { ok: false, reason: 'invalid_payload' }
    }

    const { encryptionKey, macKey } = deriveKeys(masterKey)
    const authenticatedData = `1.${envelope.iv}.${envelope.ciphertext}`
    const expectedMac = CryptoJS.HmacSHA256(authenticatedData, macKey).toString(
      CryptoJS.enc.Hex
    )
    if (!constantTimeEqual(envelope.mac, expectedMac)) {
      return { ok: false, reason: 'invalid_payload' }
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
    if (!plaintext) return { ok: false, reason: 'invalid_payload' }

    return { ok: true, value: JSON.parse(plaintext) as T }
  } catch {
    return { ok: false, reason: 'invalid_payload' }
  }
}
