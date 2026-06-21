import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { AuthScaffold, authStyles } from '@/components/auth/AuthScaffold'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

export default function LoginScreen() {
  const { theme } = useTheme()
  const { user, isWorking, configurationError, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    router.replace(user.emailVerified ? '/(app)/home' : '/(auth)/verify-email')
  }, [user])

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setError('')
    const result = await signIn(email, password)
    if (!result.ok) setError(result.error)
  }

  return (
    <AuthScaffold
      title='Sign in'
      description='Use the email and password registered with RedDot.'
    >
      <View style={authStyles.form}>
        {configurationError ? (
          <View
            style={[authStyles.notice, { backgroundColor: theme.primaryLight }]}
          >
            <Text style={[authStyles.noticeText, { color: theme.text }]}>
              {configurationError}
            </Text>
          </View>
        ) : null}
        <View style={authStyles.field}>
          <Text style={[authStyles.label, { color: theme.text }]}>Email</Text>
          <TextInput
            accessibilityLabel='Email address'
            placeholder='name@example.com'
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize='none'
            autoCorrect={false}
            keyboardType='email-address'
            textContentType='emailAddress'
            style={[
              authStyles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.surface,
              },
            ]}
          />
        </View>
        <View style={authStyles.field}>
          <Text style={[authStyles.label, { color: theme.text }]}>
            Password
          </Text>
          <TextInput
            accessibilityLabel='Password'
            placeholder='Enter your password'
            placeholderTextColor={theme.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType='password'
            returnKeyType='done'
            onSubmitEditing={() => void submit()}
            style={[
              authStyles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.surface,
              },
            ]}
          />
        </View>
        {error ? (
          <Text
            accessibilityRole='alert'
            style={[authStyles.error, { color: theme.danger }]}
          >
            {error}
          </Text>
        ) : null}
        <TouchableOpacity
          accessibilityRole='button'
          onPress={() => void submit()}
          disabled={isWorking || Boolean(configurationError)}
          style={[
            authStyles.button,
            { backgroundColor: theme.primary, opacity: isWorking ? 0.65 : 1 },
          ]}
        >
          {isWorking ? (
            <ActivityIndicator color='#FFFFFF' />
          ) : (
            <Text style={authStyles.buttonText}>Sign in</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole='link'
          onPress={() => router.push('/(auth)/forgot-password')}
          style={authStyles.secondaryButton}
        >
          <Text style={[authStyles.link, { color: theme.primary }]}>
            Forgot password?
          </Text>
        </TouchableOpacity>
        <View style={authStyles.footer}>
          <Text style={[authStyles.footerText, { color: theme.textSecondary }]}>
            New to RedDot?{' '}
          </Text>
          <TouchableOpacity
            accessibilityRole='link'
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={[authStyles.link, { color: theme.primary }]}>
              Create account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthScaffold>
  )
}
