import { deleteLocalDatabase } from '@/services/localDatabase'
import { disableAllReminders } from '@/services/reminderService'
import { emergencyWipe } from '@/services/secureStorage'

export type LocalDeletionResult =
  | { status: 'deleted' }
  | { status: 'partial_failure'; failed: Array<'database' | 'secure_storage' | 'notifications'> }

export async function deleteAllLocalData(): Promise<LocalDeletionResult> {
  const [databaseDeleted, secureStorageDeleted, notificationsCleared] = await Promise.all([
    deleteLocalDatabase(),
    emergencyWipe(),
    disableAllReminders().then((result) => result.ok),
  ])
  const failed: Array<'database' | 'secure_storage' | 'notifications'> = []
  if (!databaseDeleted) failed.push('database')
  if (!secureStorageDeleted) failed.push('secure_storage')
  if (!notificationsCleared) failed.push('notifications')

  return failed.length === 0
    ? { status: 'deleted' }
    : { status: 'partial_failure', failed }
}
