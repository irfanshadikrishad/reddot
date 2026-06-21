import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
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
  getBiometricEnabled,
  getDecoyScreen,
  hasAppPin,
  setAppLockEnabled,
  setAppPin,
  setBiometricEnabled,
  setDecoyScreen,
  setFakePin,
  verifyAppPin,
} from '@/services/secureStorage'
import { DecoyScreenType } from '@/types'

const DECOYS: Array<{ key: DecoyScreenType; label: string; note: string }> = [
  {
    key: 'calculator',
    label: 'Calculator',
    note: 'Simple tools for quick arithmetic.',
  },
  {
    key: 'notes',
    label: 'Notes',
    note: 'Plain text scratchpad for private reminders.',
  },
  {
    key: 'weather',
    label: 'Weather',
    note: 'A normal forecast view with current conditions.',
  },
  {
    key: 'news',
    label: 'News',
    note: 'Recent headlines and article cards.',
  },
]

export default function PrivacyLockSetupScreen() {
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasPin, setHasPin] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [fakePin, setFakePinValue] = useState('')
  const [confirmFakePin, setConfirmFakePin] = useState('')
  const [biometricEnabled, setBiometricEnabledValue] = useState(false)
  const [decoyScreen, setDecoyScreenValue] =
    useState<DecoyScreenType>('calculator')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    let mounted = true
    void (async () => {
      const [pinSet, biometric, decoy] = await Promise.all([
        hasAppPin(),
        getBiometricEnabled(),
        getDecoyScreen(),
      ])
      if (!mounted) return
      setHasPin(pinSet)
      setBiometricEnabledValue(biometric)
      setDecoyScreenValue(
        DECOYS.some((item) => item.key === decoy)
          ? (decoy as DecoyScreenType)
          : 'calculator'
      )
      setStatus(
        pinSet
          ? 'Update your privacy lock settings on this device.'
          : 'Create a privacy lock before using protected content.'
      )
      setIsLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  const saveEnabled = useMemo(() => {
    if (isLoading || isSaving) return false
    if (!hasPin) return newPin.trim().length >= 4 && newPin === confirmPin
    return true
  }, [confirmPin, hasPin, isLoading, isSaving, newPin])

  const save = async () => {
    setError('')
    setStatus('')

    const trimmedCurrent = currentPin.trim()
    const trimmedNew = newPin.trim()
    const trimmedFake = fakePin.trim()
    const trimmedFakeConfirm = confirmFakePin.trim()

    if (!hasPin && trimmedNew.length < 4) {
      setError('Create a PIN with at least 4 digits.')
      return
    }
    if (!hasPin && trimmedNew !== confirmPin.trim()) {
      setError('PIN entries do not match.')
      return
    }
    if (hasPin && (trimmedNew || trimmedFake) && trimmedCurrent.length < 4) {
      setError('Enter your current PIN before changing the lock.')
      return
    }
    if (hasPin && (trimmedNew || trimmedFake)) {
      const valid = await verifyAppPin(trimmedCurrent)
      if (!valid) {
        setError('Current PIN is incorrect.')
        return
      }
    }
    if (trimmedNew && trimmedNew.length < 4) {
      setError('Create a PIN with at least 4 digits.')
      return
    }
    if (trimmedNew && trimmedNew !== confirmPin.trim()) {
      setError('PIN entries do not match.')
      return
    }
    if (trimmedFake && trimmedFake.length < 4) {
      setError('Create a fake PIN with at least 4 digits.')
      return
    }
    if (trimmedFake && trimmedFake !== trimmedFakeConfirm) {
      setError('Fake PIN entries do not match.')
      return
    }
    if (trimmedNew && trimmedFake && trimmedNew === trimmedFake) {
      setError('Fake PIN must be different from the real PIN.')
      return
    }
    if (trimmedCurrent && trimmedFake && trimmedCurrent === trimmedFake) {
      setError('Fake PIN must be different from the real PIN.')
      return
    }

    setIsSaving(true)
    try {
      if (trimmedNew) {
        const savedPin = await setAppPin(trimmedNew)
        if (!savedPin) throw new Error('The PIN could not be saved.')
        const lockEnabled = await setAppLockEnabled(true)
        if (!lockEnabled)
          throw new Error('The privacy lock could not be enabled.')
      } else if (!hasPin) {
        throw new Error('Create a PIN before saving.')
      }

      if (trimmedFake) {
        const savedFake = await setFakePin(trimmedFake)
        if (!savedFake) throw new Error('The fake PIN could not be saved.')
      }

      const biometricSaved = await setBiometricEnabled(biometricEnabled)
      if (!biometricSaved)
        throw new Error('Biometric preference could not be saved.')

      const decoySaved = await setDecoyScreen(decoyScreen)
      if (!decoySaved) throw new Error('The decoy screen could not be saved.')

      setHasPin(true)
      setStatus('Privacy lock saved on this device.')
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      setFakePinValue('')
      setConfirmFakePin('')
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'The privacy lock could not be saved.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps='handled'
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
            <Text style={[styles.kicker, { color: theme.primary }]}>
              Privacy lock
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Device-only protection
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              This lock keeps safety data on the phone. Firebase only handles
              account sign-in and email verification.
            </Text>
          </View>
        </View>

        <View style={[styles.notice, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name='shield-checkmark' size={20} color={theme.primary} />
          <Text style={[styles.noticeText, { color: theme.text }]}>
            Use a PIN you can remember under stress. Do not reuse the real PIN
            as the fake PIN.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Why this matters
          </Text>
          <Text style={[styles.cardBody, { color: theme.textSecondary }]}>
            Device-local safety records can still be exposed if someone unlocks
            the phone, so RedDot adds a second layer before protected content
            opens. If the device is shared, lost, or monitored, the app cannot
            guarantee privacy.
          </Text>
          <Text style={[styles.cardBody, { color: theme.textSecondary }]}>
            Signing out or deleting local data removes this app's protected
            records from the device. Firebase stores only account identity and
            verification state.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : (
          <>
            {hasPin ? (
              <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Current PIN
                </Text>
                <TextInput
                  accessibilityLabel='Current PIN'
                  placeholder='Enter current PIN'
                  placeholderTextColor={theme.textMuted}
                  value={currentPin}
                  onChangeText={setCurrentPin}
                  keyboardType='number-pad'
                  secureTextEntry
                  maxLength={6}
                  style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.border },
                  ]}
                />
              </View>
            ) : null}

            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Real PIN
              </Text>
              <Text style={[styles.helper, { color: theme.textSecondary }]}>
                {hasPin
                  ? 'Choose a new PIN only if you want to change the current one.'
                  : 'Create the PIN that opens protected content.'}
              </Text>
              <TextInput
                accessibilityLabel='Real PIN'
                placeholder='4 to 6 digits'
                placeholderTextColor={theme.textMuted}
                value={newPin}
                onChangeText={setNewPin}
                keyboardType='number-pad'
                secureTextEntry
                maxLength={6}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border },
                ]}
              />
              <TextInput
                accessibilityLabel='Confirm real PIN'
                placeholder='Confirm PIN'
                placeholderTextColor={theme.textMuted}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType='number-pad'
                secureTextEntry
                maxLength={6}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border },
                ]}
              />
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Fake PIN
              </Text>
              <Text style={[styles.helper, { color: theme.textSecondary }]}>
                A fake PIN opens the chosen decoy screen without revealing that
                protected content exists.
              </Text>
              <TextInput
                accessibilityLabel='Fake PIN'
                placeholder='Optional fake PIN'
                placeholderTextColor={theme.textMuted}
                value={fakePin}
                onChangeText={setFakePinValue}
                keyboardType='number-pad'
                secureTextEntry
                maxLength={6}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border },
                ]}
              />
              <TextInput
                accessibilityLabel='Confirm fake PIN'
                placeholder='Confirm fake PIN'
                placeholderTextColor={theme.textMuted}
                value={confirmFakePin}
                onChangeText={setConfirmFakePin}
                keyboardType='number-pad'
                secureTextEntry
                maxLength={6}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border },
                ]}
              />
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    Biometric unlock
                  </Text>
                  <Text style={[styles.helper, { color: theme.textSecondary }]}>
                    Store the preference for devices that support local
                    authentication.
                  </Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={setBiometricEnabledValue}
                  trackColor={{ false: theme.border, true: theme.primaryLight }}
                  thumbColor={biometricEnabled ? theme.primary : '#F4F4F4'}
                />
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Decoy screen
              </Text>
              <Text style={[styles.helper, { color: theme.textSecondary }]}>
                Select the app that opens after a fake PIN.
              </Text>
              <View style={styles.decoyGrid}>
                {DECOYS.map((option) => {
                  const selected = option.key === decoyScreen
                  return (
                    <TouchableOpacity
                      key={option.key}
                      accessibilityRole='button'
                      accessibilityState={{ selected }}
                      onPress={() => setDecoyScreenValue(option.key)}
                      style={[
                        styles.decoyOption,
                        {
                          borderColor: selected ? theme.primary : theme.border,
                          backgroundColor: selected
                            ? theme.primaryLight
                            : theme.background,
                        },
                      ]}
                    >
                      <Text style={[styles.decoyLabel, { color: theme.text }]}>
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.decoyNote,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {option.note}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {error ? (
              <Text
                accessibilityRole='alert'
                style={[styles.error, { color: theme.danger }]}
              >
                {error}
              </Text>
            ) : null}
            {status ? (
              <Text style={[styles.status, { color: theme.success }]}>
                {status}
              </Text>
            ) : null}

            <TouchableOpacity
              accessibilityRole='button'
              accessibilityLabel='Save privacy lock settings'
              onPress={() => void save()}
              disabled={!saveEnabled || isSaving}
              style={[
                styles.saveButton,
                {
                  backgroundColor: theme.primary,
                  opacity: !saveEnabled || isSaving ? 0.6 : 1,
                },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color='#FFFFFF' />
              ) : (
                <Text style={styles.saveText}>Save privacy lock</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  notice: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 16,
    padding: 16,
  },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  card: { gap: 12, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardBody: { fontSize: 14, lineHeight: 20 },
  helper: { fontSize: 13, lineHeight: 19 },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  rowCopy: { flex: 1, gap: 4 },
  decoyGrid: { gap: 10 },
  decoyOption: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  decoyLabel: { fontSize: 15, fontWeight: '800' },
  decoyNote: { fontSize: 13, lineHeight: 18 },
  error: { fontSize: 14, lineHeight: 20 },
  status: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  saveButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  loadingBox: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
