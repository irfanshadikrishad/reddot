import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { router } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

export default function ForgotPasswordScreen() {
  const { sendPasswordReset, isLoading } = useAuth()
  const { theme } = useTheme()

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [sent, setSent] = useState(false)

  const handleReset = useCallback(async () => {
    if (!email.trim()) {
      setEmailError('Email is required.')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address.')
      return
    }
    setEmailError('')
    const result = await sendPasswordReset(email)
    if (result.success) {
      setSent(true)
    } else {
      setEmailError(result.error ?? 'Failed to send reset email.')
    }
  }, [email, sendPasswordReset])

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
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backText, { color: theme.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.icon}>{sent ? '📬' : '🔑'}</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            {sent ? 'Check your email' : 'Reset password'}
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {sent
              ? `We sent a password reset link to ${email}. Check your inbox and follow the instructions.`
              : "Enter your email address and we'll send you a link to reset your password."}
          </Text>

          {!sent ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  Email address
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: emailError ? theme.danger : theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t)
                    if (emailError) setEmailError('')
                  }}
                  placeholder='your@email.com'
                  placeholderTextColor={theme.textMuted}
                  keyboardType='email-address'
                  autoCapitalize='none'
                  autoCorrect={false}
                  editable={!isLoading}
                  autoFocus
                />
                {emailError ? (
                  <Text style={[styles.fieldError, { color: theme.danger }]}>
                    {emailError}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: isLoading ? 0.7 : 1,
                  },
                ]}
                onPress={handleReset}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color='#fff' />
                ) : (
                  <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Back to Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSent(false)}
                style={styles.resendButton}
              >
                <Text
                  style={[styles.resendText, { color: theme.textSecondary }]}
                >
                  Didn't receive it?{' '}
                  <Text style={{ color: theme.primary, fontWeight: '700' }}>
                    Resend
                  </Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  backButton: { marginBottom: 32 },
  backText: { fontSize: 16, fontWeight: '600' },
  content: { gap: 20, alignItems: 'center' },
  icon: { fontSize: 64 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  description: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  fieldGroup: { gap: 6, width: '100%' },
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    width: '100%',
  },
  fieldError: { fontSize: 12 },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendButton: { marginTop: 8 },
  resendText: { fontSize: 14, textAlign: 'center' },
})
