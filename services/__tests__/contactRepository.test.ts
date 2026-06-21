import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rows, getLocalDatabase, encryptLocalPayload, decryptLocalPayload } =
  vi.hoisted(() => ({
    rows: new Map<string, { id: string; encrypted_payload: string }>(),
    getLocalDatabase: vi.fn(),
    encryptLocalPayload: vi.fn(async (value: unknown) => JSON.stringify(value)),
    decryptLocalPayload: vi.fn(async (payload: string) => {
      try {
        return { ok: true as const, value: JSON.parse(payload) }
      } catch {
        return { ok: false as const, reason: 'invalid_payload' as const }
      }
    }),
  }))

vi.mock('expo-crypto', () => ({ randomUUID: () => 'contact-1' }))
vi.mock('@/services/localDatabase', () => ({ getLocalDatabase }))
vi.mock('@/services/encryptionService', () => ({
  encryptLocalPayload,
  decryptLocalPayload,
}))

import {
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from '@/services/contactRepository'
import { ContactInput } from '@/types'

const input: ContactInput = {
  name: 'Trusted person',
  phone: '01700000000',
  relation: 'Friend',
  notifyBySMS: true,
  notifyByCall: true,
  isSafeAdult: true,
}

describe('contactRepository', () => {
  beforeEach(() => {
    rows.clear()
    getLocalDatabase.mockResolvedValue({
      getAllAsync: vi.fn(async () => [...rows.values()]),
      runAsync: vi.fn(async (sql: string, ...parameters: unknown[]) => {
        if (sql.includes('INSERT INTO')) {
          rows.set(parameters[0] as string, {
            id: parameters[0] as string,
            encrypted_payload: parameters[1] as string,
          })
          return { changes: 1 }
        }
        if (sql.includes('UPDATE')) {
          const id = parameters[2] as string
          if (!rows.has(id)) return { changes: 0 }
          rows.set(id, { id, encrypted_payload: parameters[0] as string })
          return { changes: 1 }
        }
        const id = parameters[0] as string
        return { changes: rows.delete(id) ? 1 : 0 }
      }),
    })
  })

  it('creates, reads, updates, and deletes encrypted contacts', async () => {
    const created = await createContact(input)
    expect(created).toEqual({ ok: true, value: { ...input, id: 'contact-1' } })
    expect(encryptLocalPayload).toHaveBeenCalled()

    await expect(listContacts()).resolves.toEqual({
      ok: true,
      value: [{ ...input, id: 'contact-1' }],
    })

    const updatedInput = { ...input, relation: 'Sibling' }
    await expect(updateContact('contact-1', updatedInput)).resolves.toEqual({
      ok: true,
      value: { ...updatedInput, id: 'contact-1' },
    })
    await expect(deleteContact('contact-1')).resolves.toEqual({
      ok: true,
      value: undefined,
    })
    await expect(listContacts()).resolves.toEqual({ ok: true, value: [] })
  })

  it('returns a typed error for corrupt stored data', async () => {
    rows.set('contact-1', { id: 'contact-1', encrypted_payload: 'corrupt' })

    const result = await listContacts()
    expect(result).toMatchObject({ ok: false, error: { code: 'invalid_data' } })
  })
})
