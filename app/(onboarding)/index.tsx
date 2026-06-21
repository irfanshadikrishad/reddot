import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { completeLocalOnboarding, hasAppPin } from '@/services/secureStorage'

const PRIVACY_NOTES = [
  {
    icon: 'phone-portrait-outline' as const,
    title: 'Stored on this device',
    body: 'RedDot has no account or server. Your protected app data stays on this device.',
  },
  {
    icon: 'alert-circle-outline' as const,
    title: 'Emergency limits',
    body: 'RedDot can open calls and messages, but cannot confirm delivery or dispatch help.',
  },
  {
    icon: 'lock-closed-outline' as const,
    title: 'Device risk remains',
    body: 'A PIN reduces casual access but cannot protect a compromised or monitored phone.',
  },
  {
    icon: 'trash-outline' as const,
    title: 'Local deletion',
    body: 'Removing local data is permanent because RedDot has no cloud recovery.',
  },
]

export default function OnboardingScreen() {
  const { theme } = useTheme()
  const [pin, setPin] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    hasAppPin().then((isSetUp) => {
      if (isSetUp) router.replace('/(app)/home')
    })
  }, [])

  const updatePin = useCallback(
    (value: string, setter: (next: string) => void) => {
      setter(value.replace(/\D/g, '').slice(0, 6))
      if (error) setError('')
    },
    [error]
  )

  const handleContinue = useCallback(async () => {
    if (pin.length < 4) {
      setError('Choose a PIN containing 4 to 6 digits.')
      return
    }
    if (pin !== confirmation) {
      setError('The PINs do not match.')
      return
    }

    setIsSaving(true)
    const completed = await completeLocalOnboarding(pin)
    setIsSaving(false)

    if (!completed) {
      Alert.alert(
        'Setup could not be completed',
        'RedDot could not securely save your PIN. No setup was kept. Please try again.'
      )
      return
    }

    setPin('')
    setConfirmation('')
    router.replace('/(app)/home')
  }, [confirmation, pin])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.background },
        ]}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons name='shield-checkmark' size={52} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>
            Set up RedDot
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            No email or account is required. Review how this standalone app
            works, then create a local app PIN.
          </Text>
        </View>

        <View style={styles.notes}>
          {PRIVACY_NOTES.map((note) => (
            <View
              key={note.title}
              style={[styles.note, { backgroundColor: theme.surface }]}
            >
              <Ionicons name={note.icon} size={22} color={theme.primary} />
              <View style={styles.noteCopy}>
                <Text style={[styles.noteTitle, { color: theme.text }]}>
                  {note.title}
                </Text>
                <Text style={[styles.noteBody, { color: theme.textSecondary }]}>
                  {note.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.form}>
          <Text style={[styles.formTitle, { color: theme.text }]}>
            Create app PIN
          </Text>
          <Text style={[styles.formHint, { color: theme.textSecondary }]}>
            Use 4 to 6 digits that someone else cannot easily guess. There is no
            remote PIN reset.
          </Text>

          <TextInput
            accessibilityLabel='New app PIN'
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: error ? theme.danger : theme.border,
                color: theme.text,
              },
            ]}
            value={pin}
            onChangeText={(value) => updatePin(value, setPin)}
            placeholder='New PIN'
            placeholderTextColor={theme.textMuted}
            keyboardType='number-pad'
            secureTextEntry
            maxLength={6}
            editable={!isSaving}
            returnKeyType='next'
          />
          <TextInput
            accessibilityLabel='Confirm app PIN'
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: error ? theme.danger : theme.border,
                color: theme.text,
              },
            ]}
            value={confirmation}
            onChangeText={(value) => updatePin(value, setConfirmation)}
            placeholder='Confirm PIN'
            placeholderTextColor={theme.textMuted}
            keyboardType='number-pad'
            secureTextEntry
            maxLength={6}
            editable={!isSaving}
            returnKeyType='done'
            onSubmitEditing={handleContinue}
          />

          {error ? (
            <Text
              accessibilityRole='alert'
              style={[styles.error, { color: theme.danger }]}
            >
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Finish local setup'
            style={[
              styles.button,
              {
                backgroundColor: theme.primary,
                opacity: isSaving ? 0.7 : 1,
              },
            ]}
            onPress={handleContinue}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color='#FFFFFF' />
            ) : (
              <Text style={styles.buttonText}>Finish local setup</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 28,
  },
  header: { alignItems: 'center', gap: 10 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  notes: { gap: 10 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  noteCopy: { flex: 1, gap: 3 },
  noteTitle: { fontSize: 15, fontWeight: '700' },
  noteBody: { fontSize: 13, lineHeight: 19 },
  form: { gap: 12 },
  formTitle: { fontSize: 21, fontWeight: '800' },
  formHint: { fontSize: 14, lineHeight: 20, marginBottom: 2 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    letterSpacing: 4,
  },
  error: { fontSize: 13, lineHeight: 18 },
  button: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
})
