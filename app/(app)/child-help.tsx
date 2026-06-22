import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTheme } from '@/contexts/ThemeContext'
import {
  findChildHotline,
  getSafeAdults,
  openChildCall,
  openChildSms,
} from '@/services/childSafetyService'
import { EmergencyContact, Hotline } from '@/types'

const CHILD_NUMBERS = ['1098', '999']
const SAFE_MESSAGE = 'I need help. Please call me or come to me if you can.'

function safeAdultLabel(contact: EmergencyContact): string {
  const relation = contact.relation.trim()
  return relation.length > 0 ? contact.name + ' • ' + relation : contact.name
}

export default function ChildHelpScreen() {
  const { theme } = useTheme()
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [safeAdults, setSafeAdults] = useState<EmergencyContact[]>([])
  const [isLoadingAdults, setIsLoadingAdults] = useState(true)

  useEffect(() => {
    let mounted = true
    void (async () => {
      const adults = await getSafeAdults()
      if (!mounted) return
      setSafeAdults(adults)
      setIsLoadingAdults(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  const emergencyHotlines = useMemo(
    () =>
      CHILD_NUMBERS.map((number) => findChildHotline(number)).filter(
        (value): value is Hotline => Boolean(value)
      ),
    []
  )

  const callHotline = async (hotline: Hotline): Promise<void> => {
    setBusyKey(hotline.number)
    try {
      const result = await openChildCall(hotline.number)
      if (result.status !== 'opened') {
        Alert.alert(hotline.name + " unavailable", result.reason)
      }
    } finally {
      setBusyKey(null)
    }
  }

  const confirmCallAdult = (contact: EmergencyContact): void => {
    Alert.alert(
      'Call safe adult?',
      'This will open the phone app to call ' + safeAdultLabel(contact) + '.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => void finishSafeAdultCall(contact),
        },
      ]
    )
  }

  const finishSafeAdultCall = async (contact: EmergencyContact): Promise<void> => {
    setBusyKey(contact.phone)
    try {
      const result = await openChildCall(contact.phone)
      if (result.status !== 'opened') {
        Alert.alert('Call unavailable', result.reason)
      }
    } finally {
      setBusyKey(null)
    }
  }

  const confirmSmsAdult = (contact: EmergencyContact): void => {
    Alert.alert(
      'Send SMS to safe adult?',
      'This will open the SMS composer for ' + safeAdultLabel(contact) + '. RedDot will not send the message itself.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open SMS',
          onPress: () => void finishSafeAdultSms(contact),
        },
      ]
    )
  }

  const finishSafeAdultSms = async (contact: EmergencyContact): Promise<void> => {
    setBusyKey(contact.phone + "-sms")
    try {
      const result = await openChildSms([contact.phone], SAFE_MESSAGE)
      if (result.status !== 'opened') {
        Alert.alert('SMS unavailable', result.reason)
      }
    } finally {
      setBusyKey(null)
    }
  }

  const leaveChildZone = (): void => {
    router.replace('/(app)/home')
  }

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
            <Text style={[styles.kicker, { color: theme.primary }]}>Child help</Text>
            <Text style={[styles.title, { color: theme.text }]}>Simple help choices</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Short steps for immediate help, a safe adult, or a fast return to the normal screen.</Text>
          </View>
        </View>

        <View style={[styles.notice, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name='hand-left-outline' size={20} color={theme.primary} />
          <Text style={[styles.noticeText, { color: theme.text }]}>RedDot does not collect a report or contact anyone automatically. You choose each call or message first.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Need help now</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>Use the shortest button that feels safe.</Text>
          <View style={styles.quickRow}>
            {emergencyHotlines.map((hotline) => {
              const isBusy = busyKey === hotline.number
              return (
                <TouchableOpacity
                  key={hotline.number}
                  accessibilityRole='button'
                  accessibilityLabel={'Call ' + hotline.name}
                  onPress={() => void callHotline(hotline)}
                  disabled={Boolean(busyKey)}
                  style={[styles.quickButton, { backgroundColor: theme.primary, opacity: isBusy ? 0.7 : 1 }]}
                >
                  {isBusy ? (
                    <ActivityIndicator color='#FFFFFF' />
                  ) : (
                    <Text style={styles.quickButtonText}>{hotline.number}</Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Safe adults</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>Only contacts marked as safe adults appear here. If you need to add one, use trusted contacts first.</Text>
          {isLoadingAdults ? (
            <Text style={[styles.body, { color: theme.textSecondary }]}>Loading safe adults...</Text>
          ) : safeAdults.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={[styles.body, { color: theme.textSecondary }]}>No safe adult is set yet.</Text>
              <TouchableOpacity
                accessibilityRole='button'
                accessibilityLabel='Open trusted contacts'
                onPress={() => router.push('/(app)/trusted-contacts')}
                style={[styles.secondaryButton, { borderColor: theme.primary }]}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Add safe adult</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.safeAdultList}>
              {safeAdults.map((contact) => {
                const callBusy = busyKey === contact.phone
                const smsBusy = busyKey === contact.phone + "-sms"
                return (
                  <View key={contact.id} style={[styles.safeAdultCard, { borderColor: theme.border, backgroundColor: theme.background }]}>
                    <View style={styles.safeAdultCopy}>
                      <Text style={[styles.safeAdultName, { color: theme.text }]}>{contact.name}</Text>
                      <Text style={[styles.safeAdultMeta, { color: theme.textSecondary }]}>{safeAdultLabel(contact)}</Text>
                      <Text style={[styles.safeAdultMeta, { color: theme.textMuted }]}>{contact.phone}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={"Call " + contact.name}
                        onPress={() => void confirmCallAdult(contact)}
                        disabled={Boolean(busyKey)}
                        style={[styles.smallButton, { backgroundColor: theme.primary, opacity: callBusy ? 0.7 : 1 }]}
                      >
                        {callBusy ? <ActivityIndicator color='#FFFFFF' /> : <Text style={styles.smallButtonText}>Call</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole='button'
                        accessibilityLabel={"Text " + contact.name}
                        onPress={() => void confirmSmsAdult(contact)}
                        disabled={Boolean(busyKey)}
                        style={[styles.smallButton, { backgroundColor: theme.surface, borderColor: theme.primary }]}
                      >
                        {smsBusy ? <ActivityIndicator color={theme.primary} /> : <Text style={[styles.smallButtonText, { color: theme.primary }]}>SMS</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>What to do</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>1. Move to a safer place if you can.</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>2. Tap the number or safe adult you trust most.</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>3. Show the phone screen to a safe adult if speaking feels hard.</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>4. RedDot does not store a report or message outcome.</Text>
        </View>

        <TouchableOpacity
          accessibilityRole='button'
          accessibilityLabel='Leave child help'
          onPress={leaveChildZone}
          style={[styles.leaveButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.leaveButtonText}>Return to home</Text>
        </TouchableOpacity>
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
  notice: { flexDirection: "row", gap: 10, borderRadius: 16, padding: 16 },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  card: { gap: 12, borderRadius: 18, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  body: { fontSize: 14, lineHeight: 20 },
  quickRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  quickButton: { minWidth: 84, minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  quickButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  emptyBlock: { gap: 10 },
  secondaryButton: { minHeight: 48, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, alignSelf: "flex-start" },
  secondaryButtonText: { fontSize: 15, fontWeight: "800" },
  safeAdultList: { gap: 10 },
  safeAdultCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  safeAdultCopy: { gap: 4 },
  safeAdultName: { fontSize: 16, fontWeight: "800" },
  safeAdultMeta: { fontSize: 13, lineHeight: 18 },
  actionRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  smallButton: { minWidth: 88, minHeight: 44, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  smallButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  leaveButton: { minHeight: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  leaveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
})
