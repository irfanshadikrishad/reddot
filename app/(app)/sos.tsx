import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as SMS from 'expo-sms'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { BD_HOTLINES } from '@/constants/hotlines'
import { useTheme } from '@/contexts/ThemeContext'
import { loadSosDraftSettings, prepareSosMessage } from '@/services/sosService'
import { Hotline } from '@/types'

const COUNTDOWN_SECONDS = 5
const EMERGENCY_NUMBERS = ['999', '10921', '1098']

export default function SosScreen() {
  const { theme } = useTheme()
  const [busyNumber, setBusyNumber] = useState<string | null>(null)
  const [stage, setStage] = useState<
    'idle' | 'countdown' | 'preparing' | 'ready'
  >('idle')
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_SECONDS)
  const [status, setStatus] = useState('')
  const [message, setMessage] = useState('')
  const [recipients, setRecipients] = useState<string[]>([])
  const [hasSelectedContacts, setHasSelectedContacts] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let mounted = true
    void (async () => {
      const settings = await loadSosDraftSettings()
      if (!mounted) return
      setHasSelectedContacts(settings.selectedContactIds.length > 0)
    })()
    return () => {
      mounted = false
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const callHotline = async (hotline: Hotline): Promise<void> => {
    setBusyNumber(hotline.number)
    try {
      const result = await openPhoneApp(hotline.number)
      if (result !== 'opened') {
        Alert.alert(`${hotline.name} unavailable`, result)
      }
    } finally {
      setBusyNumber(null)
    }
  }

  const openPhoneApp = async (number: string): Promise<'opened' | string> => {
    const url = `tel:${number.replace(/[^\d+]/g, '')}`
    try {
      const supported = await Linking.canOpenURL(url)
      if (!supported) return 'This device cannot open the phone dialer.'
      await Linking.openURL(url)
      return 'opened'
    } catch {
      return 'The phone dialer could not be opened.'
    }
  }

  const startSos = async (): Promise<void> => {
    if (stage !== 'idle') return
    setStatus('Countdown started. Cancel if this was accidental.')
    setStage('countdown')
    setSecondsRemaining(COUNTDOWN_SECONDS)
    timerRef.current = setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          timerRef.current = null
          void finishSos()
          return 0
        }
        return current - 1
      })
    }, 1000)
  }

  const cancelSos = (): void => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setStage('idle')
    setSecondsRemaining(COUNTDOWN_SECONDS)
    setStatus('SOS cancelled.')
    setMessage('')
    setRecipients([])
  }

  const finishSos = async (): Promise<void> => {
    setStage('preparing')
    setStatus('Preparing message...')

    const prepared = await prepareSosMessage()
    if (!prepared.ok) {
      setStage('idle')
      setStatus('')
      Alert.alert('SOS unavailable', prepared.error)
      return
    }

    setMessage(prepared.value.message)
    setRecipients(prepared.value.recipients)

    const canSend = await SMS.isAvailableAsync()
    const locationNotice =
      prepared.value.locationStatus === 'unavailable'
        ? 'Location unavailable. '
        : ''
    if (canSend && prepared.value.recipients.length > 0) {
      try {
        await SMS.sendSMSAsync(
          prepared.value.recipients,
          prepared.value.message
        )
        setStatus(`${locationNotice}SMS composer opened.`)
      } catch {
        setStatus(`${locationNotice}SMS composer could not be opened.`)
      }
    } else if (!canSend) {
      setStatus(
        `${locationNotice}SMS is unavailable. Use the call buttons or share the message manually.`
      )
    } else {
      setStatus(
        `${locationNotice}No selected contacts can receive SMS. Use the call buttons or share the message manually.`
      )
    }

    setStage('ready')
  }

  const emergencyButtons = useMemo(
    () =>
      EMERGENCY_NUMBERS.map((number) =>
        BD_HOTLINES.find((item) => item.number === number)
      ).filter((value): value is Hotline => Boolean(value)),
    []
  )

  const sharePreparedMessage = async (): Promise<void> => {
    if (!message) return
    try {
      await Share.share({ message })
      setStatus('Share sheet opened for the prepared message.')
    } catch {
      setStatus('The share sheet could not be opened.')
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
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
          <Text style={[styles.kicker, { color: theme.primary }]}>SOS</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Countdown and handoff
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Nothing opens until the countdown completes. You can cancel at any
            time.
          </Text>
        </View>
      </View>

      <View style={[styles.notice, { backgroundColor: theme.primaryLight }]}>
        <Ionicons name='timer-outline' size={20} color={theme.primary} />
        <Text style={[styles.noticeText, { color: theme.text }]}>
          RedDot only reports what it knows: countdown status, whether the SMS
          composer opened, or whether an external action was unavailable.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Emergency numbers
        </Text>
        <View style={styles.quickRow}>
          {emergencyButtons.map((hotline) => {
            const isBusy = busyNumber === hotline.number
            return (
              <TouchableOpacity
                key={hotline.number}
                accessibilityRole='button'
                accessibilityLabel={`Call ${hotline.name}`}
                onPress={() => void callHotline(hotline)}
                disabled={Boolean(busyNumber) || stage !== 'idle'}
                style={[
                  styles.quickButton,
                  { backgroundColor: theme.primary, opacity: isBusy ? 0.7 : 1 },
                ]}
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
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          SOS action
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {stage === 'countdown'
            ? `Starting in ${secondsRemaining}s.`
            : stage === 'preparing'
              ? 'Preparing the message and optional location.'
              : stage === 'ready'
                ? 'Message ready. Review or use the call buttons above.'
                : hasSelectedContacts
                  ? 'Selected contacts will receive the prepared message after the countdown.'
                  : 'Select trusted contacts first so the message has a recipient.'}
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Start SOS countdown'
            onPress={() => void startSos()}
            disabled={stage !== 'idle'}
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.primary,
                opacity: stage !== 'idle' ? 0.65 : 1,
              },
            ]}
          >
            <Text style={styles.primaryButtonText}>Start SOS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Cancel SOS'
            onPress={cancelSos}
            disabled={stage === 'idle'}
            style={[styles.secondaryButton, { borderColor: theme.danger }]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.danger }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
        {status ? (
          <Text style={[styles.status, { color: theme.success }]}>
            {status}
          </Text>
        ) : null}
      </View>

      {message ? (
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Message preview
          </Text>
          <Text
            selectable
            style={[styles.preview, { color: theme.textSecondary }]}
          >
            {message}
          </Text>
          <Text style={[styles.meta, { color: theme.textMuted }]}>
            Recipients:{' '}
            {recipients.length ? recipients.join(', ') : 'none selected'}
          </Text>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Share prepared SOS message'
            onPress={() => void sharePreparedMessage()}
            disabled={!message}
            style={[
              styles.secondaryButton,
              {
                borderColor: theme.border,
                opacity: message ? 1 : 0.5,
              },
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
              Share message
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  header: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerCopy: { flex: 1, gap: 6 },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { fontSize: 26, fontWeight: '800', lineHeight: 32 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  notice: { flexDirection: 'row', gap: 10, borderRadius: 16, padding: 16 },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  card: { gap: 12, borderRadius: 18, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 20 },
  quickRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  quickButton: {
    minWidth: 84,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  quickButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  buttonRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '800' },
  status: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  preview: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 12, lineHeight: 16 },
})
