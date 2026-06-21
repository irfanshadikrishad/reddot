import { router } from 'expo-router'
import { useState } from 'react'
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

export default function ForgotPasswordScreen() {
  const { theme } = useTheme()
  const { isWorking, configurationError, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [requested, setRequested] = useState(false)

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    const result = await resetPassword(email)
    if (!result.ok) setError(result.error)
    else setRequested(true)
  }

  return (
    <AuthScaffold
      title='Reset password'
      description='Request a password-reset email for your account.'
    >
      <View style={authStyles.form}>
        {requested ? (
          <View
            style={[authStyles.notice, { backgroundColor: theme.primaryLight }]}
          >
            <Text style={[authStyles.noticeText, { color: theme.text }]}>
              Reset email sent. Check your inbox and spam folder.
            </Text>
          </View>
        ) : (
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
        )}
        {configurationError || error ? (
          <Text
            accessibilityRole='alert'
            style={[authStyles.error, { color: theme.danger }]}
          >
            {configurationError ?? error}
          </Text>
        ) : null}
        {!requested ? (
          <TouchableOpacity
            accessibilityRole='button'
            disabled={isWorking || Boolean(configurationError)}
            onPress={() => void submit()}
            style={[authStyles.button, { backgroundColor: theme.primary }]}
          >
            {isWorking ? (
              <ActivityIndicator color='#FFFFFF' />
            ) : (
              <Text style={authStyles.buttonText}>Request reset email</Text>
            )}
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          accessibilityRole='link'
          onPress={() => router.replace('/(auth)/login')}
          style={authStyles.secondaryButton}
        >
          <Text style={[authStyles.link, { color: theme.primary }]}>
            Back to sign in
          </Text>
        </TouchableOpacity>
      </View>
    </AuthScaffold>
  )
}
