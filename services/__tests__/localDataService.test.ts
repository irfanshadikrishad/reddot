import { describe, expect, it, vi } from 'vitest'

const { deleteLocalDatabase, disableAllReminders, emergencyWipe } = vi.hoisted(() => ({
  deleteLocalDatabase: vi.fn(),
  disableAllReminders: vi.fn(),
  emergencyWipe: vi.fn(),
}))

vi.mock('@/services/localDatabase', () => ({ deleteLocalDatabase }))
vi.mock('@/services/reminderService', () => ({ disableAllReminders }))
vi.mock('@/services/secureStorage', () => ({ emergencyWipe }))

import { deleteAllLocalData } from '@/services/localDataService'

describe('localDataService', () => {
  it('cancels reminders as part of a full wipe', async () => {
    deleteLocalDatabase.mockResolvedValue(true)
    emergencyWipe.mockResolvedValue(true)
    disableAllReminders.mockResolvedValue({ ok: true, value: undefined })

    const result = await deleteAllLocalData()
    expect(result).toEqual({ status: "deleted" })
    expect(disableAllReminders).toHaveBeenCalledTimes(1)
  })
})
