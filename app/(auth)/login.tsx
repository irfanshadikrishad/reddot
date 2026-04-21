// app/(auth)/login.tsx
import { router } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

export default function LoginScreen() {
  const { signInWithEmail, signInWithGoogle, isLoading, user } = useAuth()
  const { theme } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  )
  const isMounted = useRef(true)

  // Check if user is already logged in
  useEffect(() => {
    if (user && !isLoading) {
      router.replace('/(app)/home')
    }
    return () => {
      isMounted.current = false
    }
  }, [user, isLoading])

  const validate = useCallback((): boolean => {
    const newErrors: typeof errors = {}
    if (!email.trim()) newErrors.email = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = 'Enter a valid email.'
    if (!password) newErrors.password = 'Password is required.'
    else if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [email, password])

  const handleLogin = useCallback(async () => {
    if (!validate()) return

    Keyboard.dismiss()

    const result = await signInWithEmail(email, password)

    if (result.success && isMounted.current) {
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        if (isMounted.current) {
          router.replace('/(app)/home')
        }
      }, 100)
    } else if (result.error && isMounted.current) {
      Alert.alert('Sign In Failed', result.error)
    }
  }, [email, password, validate, signInWithEmail])

  const handleGoogle = useCallback(async () => {
    Keyboard.dismiss()

    const result = await signInWithGoogle()

    if (result.success && isMounted.current) {
      setTimeout(() => {
        if (isMounted.current) {
          router.replace('/(app)/home')
        }
      }, 100)
    } else if (
      result.error &&
      result.error !== 'Sign in cancelled.' &&
      isMounted.current
    ) {
      Alert.alert('Google Sign In Failed', result.error)
    }
  }, [signInWithGoogle])

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🔴</Text>
          <Text style={[styles.title, { color: theme.primary }]}>RedDot</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Safe. Private. Always.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={[styles.formTitle, { color: theme.text }]}>
            Welcome back
          </Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Email
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: errors.email ? theme.danger : theme.border,
                  color: theme.text,
                },
              ]}
              value={email}
              onChangeText={(t) => {
                setEmail(t)
                setErrors((e) => ({ ...e, email: undefined }))
              }}
              placeholder='your@email.com'
              placeholderTextColor={theme.textMuted}
              keyboardType='email-address'
              autoCapitalize='none'
              autoCorrect={false}
              editable={!isLoading}
              returnKeyType='next'
              onSubmitEditing={() => {
                const nextInput = document.getElementById('password-input')
                nextInput?.focus()
              }}
            />
            {errors.email && (
              <Text style={[styles.fieldError, { color: theme.danger }]}>
                {errors.email}
              </Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Password
            </Text>
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: theme.surface,
                  borderColor: errors.password ? theme.danger : theme.border,
                },
              ]}
            >
              <TextInput
                style={[styles.inputFlex, { color: theme.text }]}
                value={password}
                onChangeText={(t) => {
                  setPassword(t)
                  setErrors((e) => ({ ...e, password: undefined }))
                }}
                placeholder='Password'
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                returnKeyType='done'
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
              >
                <Text style={{ fontSize: 18 }}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={[styles.fieldError, { color: theme.danger }]}>
                {errors.password}
              </Text>
            )}
          </View>

          {/* Forgot password */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotButton}
          >
            <Text style={[styles.forgotText, { color: theme.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Sign in button */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.primary, opacity: isLoading ? 0.7 : 1 },
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, { backgroundColor: theme.border }]}
            />
            <Text style={[styles.dividerText, { color: theme.textMuted }]}>
              or
            </Text>
            <View
              style={[styles.dividerLine, { backgroundColor: theme.border }]}
            />
          </View>

          {/* Google */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={handleGoogle}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={[styles.googleText, { color: theme.text }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.footerLink, { color: theme.primary }]}>
              Sign up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Safety note */}
        <Text style={[styles.safetyNote, { color: theme.textMuted }]}>
          🛡️ Your information is encrypted and never shared
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'center',
    gap: 24,
  },
  header: { alignItems: 'center', gap: 6 },
  logo: { fontSize: 64 },
  title: { fontSize: 36, fontWeight: '800', letterSpacing: 1 },
  subtitle: { fontSize: 14, letterSpacing: 0.5 },
  form: { gap: 16 },
  formTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputFlex: { flex: 1, paddingVertical: 14, fontSize: 15 },
  eyeButton: { padding: 8 },
  fieldError: { fontSize: 12, marginTop: 2 },
  forgotButton: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 13, fontWeight: '600' },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  googleIcon: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleText: { fontSize: 15, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
  safetyNote: { fontSize: 12, textAlign: 'center' },
})
