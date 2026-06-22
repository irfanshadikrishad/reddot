import * as Notifications from 'expo-notifications'

import { getSetting, setSetting } from '@/services/settingsRepository'
import { ReminderPreferences, RepositoryResult } from '@/types'

const DEFAULT_CHECK_IN = { hour: 9, minute: 0 }
const DEFAULT_SAFETY_PLAN = { hour: 19, minute: 0 }

const CHECK_IN_COPY = {
  title: 'Reminder',
  body: 'Take a quiet minute for yourself.',
}

const SAFETY_PLAN_COPY = {
  title: 'Reminder',
  body: 'Review your plan when you can.',
}

function isValidTime(hour: number, minute: number): boolean {
  return Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour < 24 && minute >= 0 && minute < 60
}

function normalizeTime(hour: number, minute: number, fallback: { hour: number; minute: number }) {
  return isValidTime(hour, minute) ? { hour, minute } : fallback
}

function defaultPreferences(): ReminderPreferences {
  return {
    checkInEnabled: false,
    checkInHour: DEFAULT_CHECK_IN.hour,
    checkInMinute: DEFAULT_CHECK_IN.minute,
    checkInNotificationId: null,
    safetyPlanEnabled: false,
    safetyPlanHour: DEFAULT_SAFETY_PLAN.hour,
    safetyPlanMinute: DEFAULT_SAFETY_PLAN.minute,
    safetyPlanNotificationId: null,
  }
}

async function getStoredPreferences(): Promise<ReminderPreferences> {
  const result = await getSetting<ReminderPreferences>('reminder_preferences')
  if (!result.ok || !result.value) return defaultPreferences()
  return {
    checkInEnabled: Boolean(result.value.checkInEnabled),
    checkInHour: normalizeTime(result.value.checkInHour, result.value.checkInMinute, DEFAULT_CHECK_IN).hour,
    checkInMinute: normalizeTime(result.value.checkInHour, result.value.checkInMinute, DEFAULT_CHECK_IN).minute,
    checkInNotificationId: typeof result.value.checkInNotificationId === "string" ? result.value.checkInNotificationId : null,
    safetyPlanEnabled: Boolean(result.value.safetyPlanEnabled),
    safetyPlanHour: normalizeTime(result.value.safetyPlanHour, result.value.safetyPlanMinute, DEFAULT_SAFETY_PLAN).hour,
    safetyPlanMinute: normalizeTime(result.value.safetyPlanHour, result.value.safetyPlanMinute, DEFAULT_SAFETY_PLAN).minute,
    safetyPlanNotificationId: typeof result.value.safetyPlanNotificationId === "string" ? result.value.safetyPlanNotificationId : null,
  }
}

export async function loadReminderPreferences(): Promise<ReminderPreferences> {
  return getStoredPreferences()
}

async function canScheduleReminders(): Promise<RepositoryResult<void>> {
  const current = await Notifications.getPermissionsAsync()
  if (current.status === "granted") {
    return { ok: true, value: undefined }
  }

  const requested = await Notifications.requestPermissionsAsync()
  if (requested.status !== "granted") {
    return {
      ok: false,
      error: {
        code: 'invalid_data',
        message: 'Notification permission was not granted, so reminders were not saved.',
      },
    }
  }

  return { ok: true, value: undefined }
}

async function scheduleReminder(kind: "check_in" | "safety_plan", hour: number, minute: number): Promise<string> {
  const content = kind === "check_in" ? CHECK_IN_COPY : SAFETY_PLAN_COPY
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      sound: false,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  })
}

async function cancelReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
  } catch {
    return
  }
}

export async function saveReminderPreferences(
  next: Omit<ReminderPreferences, "checkInNotificationId" | "safetyPlanNotificationId">
): Promise<RepositoryResult<ReminderPreferences>> {
  const permission = await canScheduleReminders()
  if (!permission.ok) return permission

  const current = await getStoredPreferences()
  await Promise.all([
    cancelReminder(current.checkInNotificationId),
    cancelReminder(current.safetyPlanNotificationId),
  ])

  const updated: ReminderPreferences = {
    checkInEnabled: next.checkInEnabled,
    checkInHour: next.checkInHour,
    checkInMinute: next.checkInMinute,
    checkInNotificationId: null,
    safetyPlanEnabled: next.safetyPlanEnabled,
    safetyPlanHour: next.safetyPlanHour,
    safetyPlanMinute: next.safetyPlanMinute,
    safetyPlanNotificationId: null,
  }

  if (next.checkInEnabled) {
    updated.checkInNotificationId = await scheduleReminder("check_in", next.checkInHour, next.checkInMinute)
  }

  if (next.safetyPlanEnabled) {
    updated.safetyPlanNotificationId = await scheduleReminder("safety_plan", next.safetyPlanHour, next.safetyPlanMinute)
  }

  const saved = await setSetting("reminder_preferences", updated)
  if (!saved.ok) {
    await Promise.all([
      cancelReminder(updated.checkInNotificationId),
      cancelReminder(updated.safetyPlanNotificationId),
    ])
    return {
      ok: false,
      error: saved.error,
    }
  }

  return { ok: true, value: updated }
}

export async function disableAllReminders(): Promise<RepositoryResult<void>> {
  const current = await getStoredPreferences()
  await Promise.all([
    cancelReminder(current.checkInNotificationId),
    cancelReminder(current.safetyPlanNotificationId),
  ])

  const saved = await setSetting("reminder_preferences", {
    ...current,
    checkInEnabled: false,
    checkInNotificationId: null,
    safetyPlanEnabled: false,
    safetyPlanNotificationId: null,
  })
  if (!saved.ok) return saved
  return { ok: true, value: undefined }
}

export function reminderPreview(kind: "check_in" | "safety_plan"): { title: string; body: string } {
  return kind === "check_in" ? CHECK_IN_COPY : SAFETY_PLAN_COPY
}

export function formatReminderTime(hour: number, minute: number): string {
  const hh = String(hour).padStart(2, "0")
  const mm = String(minute).padStart(2, "0")
  return hh + ":" + mm
}
