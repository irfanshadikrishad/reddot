import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTheme } from '@/contexts/ThemeContext'
import {
  disableAllReminders,
  formatReminderTime,
  loadReminderPreferences,
  reminderPreview,
  saveReminderPreferences,
} from '@/services/reminderService'

function parseTime(value: string): { hour: number; minute: number } | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

export default function RemindersScreen() {
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [checkInEnabled, setCheckInEnabled] = useState(false)
  const [checkInTime, setCheckInTime] = useState("09:00")
  const [safetyPlanEnabled, setSafetyPlanEnabled] = useState(false)
  const [safetyPlanTime, setSafetyPlanTime] = useState("19:00")

  useEffect(() => {
    let mounted = true
    void (async () => {
      const prefs = await loadReminderPreferences()
      if (!mounted) return
      setCheckInEnabled(prefs.checkInEnabled)
      setCheckInTime(formatReminderTime(prefs.checkInHour, prefs.checkInMinute))
      setSafetyPlanEnabled(prefs.safetyPlanEnabled)
      setSafetyPlanTime(formatReminderTime(prefs.safetyPlanHour, prefs.safetyPlanMinute))
      setIsLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  const save = async (): Promise<void> => {
    setError("")
    setStatus("")
    const checkIn = parseTime(checkInTime)
    const plan = parseTime(safetyPlanTime)
    if ((checkInEnabled && !checkIn) || (safetyPlanEnabled && !plan)) {
      setError('Use HH:MM time format, such as 09:00.')
      return
    }
    setIsSaving(true)
    const result = await saveReminderPreferences({
      checkInEnabled,
      checkInHour: checkIn?.hour ?? 9,
      checkInMinute: checkIn?.minute ?? 0,
      safetyPlanEnabled,
      safetyPlanHour: plan?.hour ?? 19,
      safetyPlanMinute: plan?.minute ?? 0,
    })
    setIsSaving(false)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setStatus("Reminder settings saved.")
  }

  const disableAll = async (): Promise<void> => {
    setIsSaving(true)
    const result = await disableAllReminders()
    setIsSaving(false)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setCheckInEnabled(false)
    setSafetyPlanEnabled(false)
    setStatus("All reminders disabled.")
  }

  const previewCheckIn = reminderPreview("check_in")
  const previewPlan = reminderPreview("safety_plan")

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Back'
            onPress={() => router.back()}
            style={[styles.backButton, { borderColor: theme.border }]}
          >
            <Ionicons name='arrow-back' size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={[styles.kicker, { color: theme.primary }]}>Reminders</Text>
            <Text style={[styles.title, { color: theme.text }]}>Local check-ins</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Opt in to neutral daily reminders for a private check-in and safety-plan review. The wording is safe for a lock screen.</Text>
          </View>
        </View>

        <View style={[styles.notice, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name='notifications-outline' size={20} color={theme.primary} />
          <Text style={[styles.noticeText, { color: theme.text }]}>Notification permission is requested only when you save enabled reminders. Denying it does not block the rest of the app.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Check-in reminder</Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>Enable check-in reminder</Text>
            <Switch value={checkInEnabled} onValueChange={setCheckInEnabled} />
          </View>
          <TextInput
            accessibilityLabel='Check-in time'
            placeholder='09:00'
            placeholderTextColor={theme.textMuted}
            value={checkInTime}
            onChangeText={setCheckInTime}
            keyboardType='numeric'
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          />
          <View style={[styles.preview, { backgroundColor: theme.surfaceSecondary }]}>
            <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>Lock-screen preview</Text>
            <Text style={[styles.previewTitle, { color: theme.text }]}>{previewCheckIn.title}</Text>
            <Text style={[styles.previewBody, { color: theme.textSecondary }]}>{previewCheckIn.body}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Safety plan reminder</Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>Enable safety-plan reminder</Text>
            <Switch value={safetyPlanEnabled} onValueChange={setSafetyPlanEnabled} />
          </View>
          <TextInput
            accessibilityLabel='Safety plan time'
            placeholder='19:00'
            placeholderTextColor={theme.textMuted}
            value={safetyPlanTime}
            onChangeText={setSafetyPlanTime}
            keyboardType='numeric'
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          />
          <View style={[styles.preview, { backgroundColor: theme.surfaceSecondary }]}>
            <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>Lock-screen preview</Text>
            <Text style={[styles.previewTitle, { color: theme.text }]}>{previewPlan.title}</Text>
            <Text style={[styles.previewBody, { color: theme.textSecondary }]}>{previewPlan.body}</Text>
          </View>
        </View>

        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
        {status ? <Text style={[styles.status, { color: theme.success }]}>{status}</Text> : null}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Save reminders'
            onPress={() => void save()}
            disabled={isSaving || isLoading}
            style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: isSaving ? 0.7 : 1 }]}
          >
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Save reminders</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Disable all reminders'
            onPress={() => void disableAll()}
            disabled={isSaving || isLoading}
            style={[styles.secondaryButton, { borderColor: theme.danger, backgroundColor: theme.surface }]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.danger }]}>Disable all</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20, gap: 16 },
  header: { flexDirection: "row", gap: 14, alignItems: "flex-start", paddingTop: 10 },
  backButton: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  headerCopy: { flex: 1, gap: 6 },
  kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  title: { fontSize: 26, fontWeight: "800", lineHeight: 32 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  notice: { flexDirection: "row", gap: 10, borderRadius: 16, padding: 16, alignItems: "flex-start" },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  card: { gap: 12, borderRadius: 18, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  switchRow: { flexDirection: "row", gap: 12, justifyContent: "space-between", alignItems: "center" },
  switchLabel: { flex: 1, fontSize: 14, fontWeight: "700" },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  preview: { gap: 4, borderRadius: 14, padding: 14 },
  previewLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  previewTitle: { fontSize: 15, fontWeight: "800" },
  previewBody: { fontSize: 14, lineHeight: 20 },
  buttonRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  primaryButton: { minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, flexGrow: 1 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  secondaryButton: { minHeight: 52, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, flexGrow: 1 },
  secondaryButtonText: { fontSize: 16, fontWeight: "800" },
  error: { fontSize: 14, lineHeight: 20 },
  status: { fontSize: 14, lineHeight: 20, fontWeight: "700" },
})
