import { describe, expect, it, vi } from 'vitest'

vi.mock('expo-sqlite', () => ({}))

import { migrateLocalDatabase } from '@/services/localDatabase'

describe('local database migrations', () => {
  it('creates schema once and is idempotent', async () => {
    let version = 0
    const statements: string[] = []
    const database = {
      getFirstAsync: vi.fn(async () => ({ user_version: version })),
      withTransactionAsync: vi.fn(async (callback: () => Promise<void>) =>
        callback()
      ),
      execAsync: vi.fn(async (sql: string) => {
        statements.push(sql)
        if (sql.includes('PRAGMA user_version = 3')) version = 3
      }),
    }

    await migrateLocalDatabase(database as never)
    await migrateLocalDatabase(database as never)

    expect(
      statements.filter((statement) => statement.includes('CREATE TABLE'))
    ).toHaveLength(3)
    expect(database.withTransactionAsync).toHaveBeenCalledTimes(1)
    expect(version).toBe(3)
  })
})
