import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  getSetting,
  setSetting,
} = vi.hoisted(() => ({
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  cancelScheduledNotificationAsync: vi.fn(),
  getSetting: vi.fn(),
  setSetting: vi.fn(),
}))

vi.mock('expo-notifications', () => ({
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
  },
}))
vi.mock('@/services/settingsRepository', () => ({ getSetting, setSetting }))

import {
  disableAllReminders,
  formatReminderTime,
  loadReminderPreferences,
  reminderPreview,
  saveReminderPreferences,
} from '@/services/reminderService'

describe('reminderService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPermissionsAsync.mockResolvedValue({ status: 'granted' })
    requestPermissionsAsync.mockResolvedValue({ status: 'granted' })
    scheduleNotificationAsync.mockResolvedValue('notification-id')
    getSetting.mockResolvedValue({ ok: true, value: null })
    setSetting.mockResolvedValue({ ok: true, value: undefined })
  })

  it('returns neutral reminder previews', () => {
    expect(reminderPreview('check_in')).toEqual({
      title: 'Reminder',
      body: 'Take a quiet minute for yourself.',
    })
  })

  it('saves and schedules enabled reminders', async () => {
    const saved = await saveReminderPreferences({
      checkInEnabled: true,
      checkInHour: 9,
      checkInMinute: 30,
      safetyPlanEnabled: true,
      safetyPlanHour: 19,
      safetyPlanMinute: 15,
    })

    expect(saved.ok).toBe(true)
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(2)
    expect(setSetting).toHaveBeenCalledWith(
      'reminder_preferences',
      expect.objectContaining({
        checkInEnabled: true,
        safetyPlanEnabled: true,
      })
    )
  })

  it('loads default reminder preferences when nothing is stored', async () => {
    const prefs = await loadReminderPreferences()
    expect(prefs.checkInEnabled).toBe(false)
    expect(prefs.safetyPlanEnabled).toBe(false)
  })

  it('disables reminders and cancels scheduled notifications', async () => {
    getSetting.mockResolvedValueOnce({
      ok: true,
      value: {
        checkInEnabled: true,
        checkInHour: 9,
        checkInMinute: 0,
        checkInNotificationId: 'check-in-id',
        safetyPlanEnabled: true,
        safetyPlanHour: 19,
        safetyPlanMinute: 0,
        safetyPlanNotificationId: 'plan-id',
      },
    })

    const disabled = await disableAllReminders()
    expect(disabled.ok).toBe(true)
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2)
  })
})
