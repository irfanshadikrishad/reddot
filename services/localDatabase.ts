import * as SQLite from 'expo-sqlite'

const DATABASE_NAME = 'reddot.db'
const CURRENT_SCHEMA_VERSION = 3

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null

export async function migrateLocalDatabase(
  database: SQLite.SQLiteDatabase
): Promise<void> {
  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  )
  const currentVersion = versionRow?.user_version ?? 0

  if (currentVersion >= CURRENT_SCHEMA_VERSION) return

  await database.withTransactionAsync(async () => {
    if (currentVersion < 1) {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS emergency_contacts (
          id TEXT PRIMARY KEY NOT NULL,
          encrypted_payload TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS local_settings (
          key TEXT PRIMARY KEY NOT NULL,
          encrypted_payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `)
    }

    if (currentVersion < 2) {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS safety_plans (
          id TEXT PRIMARY KEY NOT NULL,
          encrypted_payload TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `)
    }

    if (currentVersion < 3) {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS journal_entries (
          id TEXT PRIMARY KEY NOT NULL,
          encrypted_payload TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `)
    }

    await database.execAsync(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION}`)
  })
}

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME)
  await database.execAsync(
    'PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;'
  )
  await migrateLocalDatabase(database)
  return database
}

export function getLocalDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= openDatabase().catch((error) => {
    databasePromise = null
    throw error
  })
  return databasePromise
}

export async function deleteLocalDatabase(): Promise<boolean> {
  try {
    if (databasePromise) {
      const database = await databasePromise
      await database.closeAsync()
      databasePromise = null
    }
    await SQLite.deleteDatabaseAsync(DATABASE_NAME)
    return true
  } catch {
    databasePromise = null
    return false
  }
}
