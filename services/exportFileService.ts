import * as Crypto from 'expo-crypto'
import * as FileSystem from 'expo-file-system/legacy'

import { RepositoryResult } from '@/types'

const EXPORT_DIRECTORY =
  (FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '') +
  'reddot-exports/'

function failure(message: string): RepositoryResult<never> {
  return {
    ok: false,
    error: {
      code: 'write_failed',
      message,
    },
  }
}

async function ensureExportDirectory(): Promise<boolean> {
  try {
    await FileSystem.makeDirectoryAsync(EXPORT_DIRECTORY, {
      intermediates: true,
    })
    return true
  } catch {
    return false
  }
}

function sanitizePrefix(prefix: string): string {
  return (
    prefix
      .trim()
      .replace(/[^a-z0-9_-]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'reddot-backup'
  )
}

async function randomSuffix(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(6)
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function prepareBackupExportFile(
  prefix: string,
  contents: string
): Promise<RepositoryResult<string>> {
  if (!contents.trim()) {
    return failure('The backup file could not be prepared.')
  }

  const directoryReady = await ensureExportDirectory()
  if (!directoryReady) {
    return failure('The backup file could not be prepared.')
  }

  try {
    const fileName = `${sanitizePrefix(prefix)}-${Date.now()}-${await randomSuffix()}.json`
    const fileUri = EXPORT_DIRECTORY + fileName
    await FileSystem.writeAsStringAsync(fileUri, contents, {
      encoding: FileSystem.EncodingType.UTF8,
    })
    return { ok: true, value: fileUri }
  } catch {
    return failure('The backup file could not be prepared.')
  }
}

export async function deleteBackupExportFile(
  fileUri: string | null
): Promise<void> {
  if (!fileUri) return
  try {
    await FileSystem.deleteAsync(fileUri, { idempotent: true })
  } catch {
    return
  }
}
