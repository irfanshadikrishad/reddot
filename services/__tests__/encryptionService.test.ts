import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getOrCreateLocalDataKey, getRandomBytesAsync } = vi.hoisted(() => ({
  getOrCreateLocalDataKey: vi.fn(),
  getRandomBytesAsync: vi.fn(),
}))

vi.mock('@/services/secureStorage', () => ({ getOrCreateLocalDataKey }))
vi.mock('expo-crypto', () => ({ getRandomBytesAsync }))

import {
  decryptLocalPayload,
  encryptLocalPayload,
} from '@/services/encryptionService'

describe('encryptionService', () => {
  beforeEach(() => {
    getOrCreateLocalDataKey.mockResolvedValue('ab'.repeat(32))
    getRandomBytesAsync.mockResolvedValue(
      Uint8Array.from({ length: 16 }, (_, index) => index)
    )
  })

  it('round trips structured values without exposing plaintext', async () => {
    const value = { name: 'Private contact', phone: '01700000000' }
    const encrypted = await encryptLocalPayload(value)

    expect(encrypted).not.toBeNull()
    expect(encrypted).not.toContain(value.name)
    expect(encrypted).not.toContain(value.phone)
    await expect(decryptLocalPayload(encrypted!)).resolves.toEqual({
      ok: true,
      value,
    })
  })

  it('rejects modified ciphertext', async () => {
    const encrypted = await encryptLocalPayload({ private: 'value' })
    const envelope = JSON.parse(encrypted!)
    envelope.ciphertext = `${envelope.ciphertext.slice(0, -2)}AA`

    await expect(
      decryptLocalPayload(JSON.stringify(envelope))
    ).resolves.toEqual({
      ok: false,
      reason: 'invalid_payload',
    })
  })

  it('fails closed when the secure key is unavailable', async () => {
    getOrCreateLocalDataKey.mockResolvedValue(null)

    await expect(encryptLocalPayload({ private: 'value' })).resolves.toBeNull()
    await expect(decryptLocalPayload('{}')).resolves.toEqual({
      ok: false,
      reason: 'key_unavailable',
    })
  })
})
