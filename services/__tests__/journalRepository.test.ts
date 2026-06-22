import { beforeEach, describe, expect, it, vi } from 'vitest'

const { randomBytes, journalKey, getLocalDatabase } = vi.hoisted(() => ({
  randomBytes: vi.fn(async () => new Uint8Array(16).fill(7)),
  journalKey: vi.fn(async () => 'a'.repeat(64)),
  getLocalDatabase: vi.fn(),
}))

vi.mock('expo-crypto', () => ({ getRandomBytesAsync: randomBytes }))
vi.mock('@/services/secureStorage', () => ({ getOrCreateJournalKey: journalKey }))
vi.mock('@/services/localDatabase', () => ({ getLocalDatabase }))

import {
  deleteJournalEntry,
  getJournalEntries,
  getJournalEntry,
  saveJournalEntry,
} from '@/services/journalRepository'

const db = {
  getFirstAsync: vi.fn(),
  getAllAsync: vi.fn(),
  runAsync: vi.fn(),
}

describe('journalRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getLocalDatabase.mockResolvedValue(db)
    db.getFirstAsync.mockResolvedValue(null)
    db.getAllAsync.mockResolvedValue([])
    db.runAsync.mockResolvedValue(undefined)
  })

  it('saves encrypted journal entries without plaintext in the stored payload', async () => {
    const saved = await saveJournalEntry({
      uid: 'user-1',
      title: 'Private note',
      content: 'This stays local.',
      mood: 'hopeful',
      tags: ['tag one', 'tag two'],
    })

    expect(saved.ok).toBe(true)
    expect(db.runAsync).toHaveBeenCalledTimes(1)
    const encryptedPayload = db.runAsync.mock.calls[0][2] as string
    expect(encryptedPayload).not.toContain('Private note')
    expect(encryptedPayload).not.toContain('This stays local.')
  })

  it('lists and opens encrypted journal entries', async () => {
    const saved = await saveJournalEntry({
      uid: 'user-1',
      title: 'Private note',
      content: 'This stays local.',
      mood: 'hopeful',
      tags: ['tag one'],
    })
    expect(saved.ok).toBe(true)
    if (!saved.ok) return

    const encryptedPayload = db.runAsync.mock.calls[0][2] as string
    db.getAllAsync.mockResolvedValueOnce([
      {
        id: saved.value.id,
        encrypted_payload: encryptedPayload,
        created_at: saved.value.createdAt,
        updated_at: saved.value.updatedAt,
      },
    ])
    db.getFirstAsync.mockResolvedValueOnce({
      id: saved.value.id,
      encrypted_payload: encryptedPayload,
      created_at: saved.value.createdAt,
      updated_at: saved.value.updatedAt,
    })

    const listed = await getJournalEntries('all')
    expect(listed).toEqual({ ok: true, value: [saved.value] })

    const opened = await getJournalEntry(saved.value.id)
    expect(opened).toEqual({ ok: true, value: saved.value })
  })

  it('deletes journal entries so they are not reopened after restart', async () => {
    const saved = await saveJournalEntry({
      uid: 'user-1',
      title: 'Private note',
      content: 'This stays local.',
      mood: 'hopeful',
      tags: [],
    })
    expect(saved.ok).toBe(true)
    if (!saved.ok) return

    await deleteJournalEntry(saved.value.id)
    expect(db.runAsync).toHaveBeenCalled()

    db.getFirstAsync.mockResolvedValueOnce(null)
    const reopened = await getJournalEntry(saved.value.id)
    expect(reopened.ok).toBe(false)
    if (!reopened.ok) {
      expect(reopened.error.code).toBe('not_found')
    }
  })
})
