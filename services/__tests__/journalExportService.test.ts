import { describe, expect, it, vi } from 'vitest'

const { randomBytes } = vi.hoisted(() => ({
  randomBytes: vi.fn(async () => new Uint8Array(16).fill(7)),
}))

vi.mock('expo-crypto', () => ({ getRandomBytesAsync: randomBytes }))

import {
  createJournalBackup,
  restoreJournalBackup,
} from '@/services/journalExportService'
import { JournalEntry } from '@/types'

const entries: JournalEntry[] = [
  {
    id: 'journal-1',
    uid: 'user-1',
    title: 'Private note',
    content: 'This stays local.',
    mediaUrls: [],
    mood: 'hopeful',
    tags: ['one'],
    createdAt: 123,
    updatedAt: 123,
    isEncrypted: true,
  },
]

describe('journalExportService', () => {
  it('creates and restores an encrypted journal backup', async () => {
    const backup = await createJournalBackup(entries, 'passphrase')
    expect(backup.ok).toBe(true)
    if (!backup.ok) return

    const restored = await restoreJournalBackup(backup.value, 'passphrase')
    expect(restored).toEqual({ ok: true, value: entries })
  }, 15000)

  it('rejects a wrong passphrase without revealing journal content', async () => {
    const backup = await createJournalBackup(entries, 'passphrase')
    expect(backup.ok).toBe(true)
    if (!backup.ok) return

    const restored = await restoreJournalBackup(backup.value, 'wrong')
    expect(restored.ok).toBe(false)
  }, 15000)
})
