import * as Crypto from 'expo-crypto'

import {
  decryptLocalPayload,
  encryptLocalPayload,
} from '@/services/encryptionService'
import { getLocalDatabase } from '@/services/localDatabase'
import { ContactInput, EmergencyContact, RepositoryResult } from '@/types'

interface ContactRow {
  id: string
  encrypted_payload: string
}

const databaseError = (): RepositoryResult<never> => ({
  ok: false,
  error: {
    code: 'database_unavailable',
    message: 'Local contacts are unavailable. Please try again.',
  },
})

const invalidDataError = (): RepositoryResult<never> => ({
  ok: false,
  error: {
    code: 'invalid_data',
    message: 'A local contact could not be read safely.',
  },
})

function isContact(value: unknown): value is EmergencyContact {
  if (!value || typeof value !== 'object') return false
  const contact = value as Partial<EmergencyContact>
  return (
    typeof contact.id === 'string' &&
    typeof contact.name === 'string' &&
    typeof contact.phone === 'string' &&
    typeof contact.relation === 'string' &&
    typeof contact.notifyBySMS === 'boolean' &&
    typeof contact.notifyByCall === 'boolean' &&
    typeof contact.isSafeAdult === 'boolean'
  )
}

function validateInput(input: ContactInput): boolean {
  return input.name.trim().length > 0 && input.phone.trim().length > 0
}

async function decryptContact(
  row: ContactRow
): Promise<RepositoryResult<EmergencyContact>> {
  const decrypted = await decryptLocalPayload<EmergencyContact>(
    row.encrypted_payload
  )
  if (!decrypted.ok || !isContact(decrypted.value)) return invalidDataError()
  if (decrypted.value.id !== row.id) return invalidDataError()
  return { ok: true, value: decrypted.value }
}

export async function listContacts(): Promise<
  RepositoryResult<EmergencyContact[]>
> {
  try {
    const database = await getLocalDatabase()
    const rows = await database.getAllAsync<ContactRow>(
      'SELECT id, encrypted_payload FROM emergency_contacts ORDER BY created_at ASC'
    )
    const contacts: EmergencyContact[] = []
    for (const row of rows) {
      const contact = await decryptContact(row)
      if (!contact.ok) return contact
      contacts.push(contact.value)
    }
    return { ok: true, value: contacts }
  } catch {
    return databaseError()
  }
}

export async function createContact(
  input: ContactInput
): Promise<RepositoryResult<EmergencyContact>> {
  if (!validateInput(input)) return invalidDataError()

  const contact: EmergencyContact = {
    ...input,
    id: Crypto.randomUUID(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    relation: input.relation.trim(),
  }
  const encrypted = await encryptLocalPayload(contact)
  if (!encrypted) {
    return {
      ok: false,
      error: {
        code: 'encryption_unavailable',
        message: 'The contact could not be encrypted and was not saved.',
      },
    }
  }

  try {
    const database = await getLocalDatabase()
    const now = Date.now()
    await database.runAsync(
      `INSERT INTO emergency_contacts
        (id, encrypted_payload, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      contact.id,
      encrypted,
      now,
      now
    )
    return { ok: true, value: contact }
  } catch {
    return databaseError()
  }
}

export async function updateContact(
  id: string,
  input: ContactInput
): Promise<RepositoryResult<EmergencyContact>> {
  if (!id || !validateInput(input)) return invalidDataError()
  const contact: EmergencyContact = {
    ...input,
    id,
    name: input.name.trim(),
    phone: input.phone.trim(),
    relation: input.relation.trim(),
  }
  const encrypted = await encryptLocalPayload(contact)
  if (!encrypted) {
    return {
      ok: false,
      error: {
        code: 'encryption_unavailable',
        message: 'The contact could not be encrypted and was not changed.',
      },
    }
  }

  try {
    const database = await getLocalDatabase()
    const result = await database.runAsync(
      `UPDATE emergency_contacts
       SET encrypted_payload = ?, updated_at = ?
       WHERE id = ?`,
      encrypted,
      Date.now(),
      id
    )
    if (result.changes === 0) {
      return {
        ok: false,
        error: { code: 'not_found', message: 'The contact no longer exists.' },
      }
    }
    return { ok: true, value: contact }
  } catch {
    return databaseError()
  }
}

export async function deleteContact(
  id: string
): Promise<RepositoryResult<void>> {
  try {
    const database = await getLocalDatabase()
    const result = await database.runAsync(
      'DELETE FROM emergency_contacts WHERE id = ?',
      id
    )
    if (result.changes === 0) {
      return {
        ok: false,
        error: { code: 'not_found', message: 'The contact no longer exists.' },
      }
    }
    return { ok: true, value: undefined }
  } catch {
    return databaseError()
  }
}
