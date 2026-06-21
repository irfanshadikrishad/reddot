import { deleteLocalDatabase } from '@/services/localDatabase'
import { emergencyWipe } from '@/services/secureStorage'

export type LocalDeletionResult =
  | { status: 'deleted' }
  | { status: 'partial_failure'; failed: Array<'database' | 'secure_storage'> }

export async function deleteAllLocalData(): Promise<LocalDeletionResult> {
  const [databaseDeleted, secureStorageDeleted] = await Promise.all([
    deleteLocalDatabase(),
    emergencyWipe(),
  ])
  const failed: Array<'database' | 'secure_storage'> = []
  if (!databaseDeleted) failed.push('database')
  if (!secureStorageDeleted) failed.push('secure_storage')

  return failed.length === 0
    ? { status: 'deleted' }
    : { status: 'partial_failure', failed }
}
