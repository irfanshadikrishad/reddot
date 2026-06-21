import { beforeEach, describe, expect, it, vi } from 'vitest'

const { store, getItemAsync, getRandomBytesAsync } = vi.hoisted(() => ({
  store: new Map<string, string>(),
  getItemAsync: vi.fn(async (key: string) => store.get(key) ?? null),
  getRandomBytesAsync: vi.fn(),
}))

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: vi.fn(async (_algorithm: string, value: string) => value),
  getRandomBytesAsync,
}))
vi.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when-unlocked',
  getItemAsync,
  setItemAsync: vi.fn(async (key: string, value: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1))
    store.set(key, value)
  }),
  deleteItemAsync: vi.fn(async (key: string) => store.delete(key)),
}))

import { getOrCreateLocalDataKey } from '@/services/secureStorage'

describe('secureStorage local data key', () => {
  beforeEach(() => {
    store.clear()
    getItemAsync.mockReset()
    getItemAsync.mockImplementation(
      async (key: string) => store.get(key) ?? null
    )
    getRandomBytesAsync.mockReset()
    getRandomBytesAsync.mockResolvedValue(
      Uint8Array.from({ length: 32 }, () => 7)
    )
  })

  it('serializes concurrent first-use key creation', async () => {
    const [first, second] = await Promise.all([
      getOrCreateLocalDataKey(),
      getOrCreateLocalDataKey(),
    ])

    expect(first).toBe(second)
    expect(first).toMatch(/^[a-f0-9]{64}$/)
    expect(getRandomBytesAsync).toHaveBeenCalledTimes(1)
  })

  it('rejects a malformed stored key', async () => {
    store.set('reddot_local_data_key', 'invalid')
    await expect(getOrCreateLocalDataKey()).resolves.toBeNull()
  })

  it('does not replace a key when secure storage cannot be read', async () => {
    getItemAsync.mockRejectedValue(new Error('Secure storage unavailable'))

    await expect(getOrCreateLocalDataKey()).resolves.toBeNull()
    expect(getRandomBytesAsync).not.toHaveBeenCalled()
  })
})
