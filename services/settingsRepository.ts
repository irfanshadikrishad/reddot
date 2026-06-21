import {
  decryptLocalPayload,
  encryptLocalPayload,
} from '@/services/encryptionService'
import { getLocalDatabase } from '@/services/localDatabase'
import { LocalSettingKey, RepositoryResult } from '@/types'

interface SettingRow {
  encrypted_payload: string
}

export async function getSetting<T>(
  key: LocalSettingKey
): Promise<RepositoryResult<T | null>> {
  try {
    const database = await getLocalDatabase()
    const row = await database.getFirstAsync<SettingRow>(
      'SELECT encrypted_payload FROM local_settings WHERE key = ?',
      key
    )
    if (!row) return { ok: true, value: null }

    const decrypted = await decryptLocalPayload<T>(row.encrypted_payload)
    if (!decrypted.ok) {
      return {
        ok: false,
        error: {
          code: 'invalid_data',
          message: 'A local setting could not be read safely.',
        },
      }
    }
    return { ok: true, value: decrypted.value }
  } catch {
    return {
      ok: false,
      error: {
        code: 'database_unavailable',
        message: 'Local settings are unavailable. Please try again.',
      },
    }
  }
}

export async function setSetting<T>(
  key: LocalSettingKey,
  value: T
): Promise<RepositoryResult<void>> {
  const encrypted = await encryptLocalPayload(value)
  if (!encrypted) {
    return {
      ok: false,
      error: {
        code: 'encryption_unavailable',
        message: 'The setting could not be encrypted and was not saved.',
      },
    }
  }

  try {
    const database = await getLocalDatabase()
    await database.runAsync(
      `INSERT INTO local_settings (key, encrypted_payload, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         encrypted_payload = excluded.encrypted_payload,
         updated_at = excluded.updated_at`,
      key,
      encrypted,
      Date.now()
    )
    return { ok: true, value: undefined }
  } catch {
    return {
      ok: false,
      error: {
        code: 'write_failed',
        message: 'The setting was not saved. Please try again.',
      },
    }
  }
}
