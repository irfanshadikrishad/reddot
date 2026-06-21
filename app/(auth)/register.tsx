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

export default function RegisterScreen() {
  const { theme } = useTheme()
  const { user, isWorking, configurationError, register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')

  type RegisterField = {
    label: string
    value: string
    onChangeText: (value: string) => void
    contentType: 'name' | 'emailAddress' | 'newPassword'
    secure: boolean
    placeholder: string
  }

  useEffect(() => {
    if (user) router.replace('/(auth)/verify-email')
  }, [user])

  const submit = async () => {
    if (name.trim().length < 2) {
      setError('Enter your name.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.')
      return
    }
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }
    setError('')
    const result = await register(name, email, password)
    if (!result.ok) setError(result.error)
  }

  const fields: RegisterField[] = [
    {
      label: 'Name',
      value: name,
      onChangeText: setName,
      contentType: 'name' as const,
      secure: false,
      placeholder: 'Your full name',
    },
    {
      label: 'Email',
      value: email,
      onChangeText: setEmail,
      contentType: 'emailAddress' as const,
      secure: false,
      placeholder: 'name@example.com',
    },
    {
      label: 'Password',
      value: password,
      onChangeText: setPassword,
      contentType: 'newPassword' as const,
      secure: true,
      placeholder: 'Create a password',
    },
    {
      label: 'Confirm password',
      value: confirmation,
      onChangeText: setConfirmation,
      contentType: 'newPassword' as const,
      secure: true,
      placeholder: 'Repeat password',
    },
  ]

  return (
    <AuthScaffold
      title='Create account'
      description='Register with email. You must verify the address before protected content opens.'
    >
      <View style={authStyles.form}>
        {fields.map((field) => (
          <View key={field.label} style={authStyles.field}>
            <Text style={[authStyles.label, { color: theme.text }]}>
              {field.label}
            </Text>
            <TextInput
              accessibilityLabel={field.label}
              value={field.value}
              onChangeText={field.onChangeText}
              secureTextEntry={field.secure}
              textContentType={field.contentType}
              placeholder={field.placeholder}
              placeholderTextColor={theme.textMuted}
              autoCapitalize={field.label === 'Name' ? 'words' : 'none'}
              autoCorrect={false}
              keyboardType={
                field.label === 'Email' ? 'email-address' : 'default'
              }
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
        ))}
        {configurationError || error ? (
          <Text
            accessibilityRole='alert'
            style={[authStyles.error, { color: theme.danger }]}
          >
            {configurationError ?? error}
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
            <Text style={authStyles.buttonText}>Create account</Text>
          )}
        </TouchableOpacity>
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
