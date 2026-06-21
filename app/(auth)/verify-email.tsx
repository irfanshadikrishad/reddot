import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

import { AuthScaffold, authStyles } from '@/components/auth/AuthScaffold'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

export default function VerifyEmailScreen() {
  const { theme } = useTheme()
  const { user, isWorking, resendVerification, refreshUser, signOut } =
    useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) router.replace('/(auth)/login')
    else if (user.emailVerified) router.replace('/(app)/home')
  }, [user])

  const checkVerification = async () => {
    setError('')
    setMessage('')
    const result = await refreshUser()
    if (!result.ok) setError(result.error)
    else setMessage('Verification status refreshed.')
  }

  const resend = async () => {
    setError('')
    setMessage('')
    const result = await resendVerification()
    if (!result.ok) setError(result.error)
    else {
      setMessage('Verification email sent. Check your inbox and spam folder.')
    }
  }

  const useAnotherAccount = async () => {
    setError('')
    const result = await signOut()
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (result.warning) setMessage(result.warning)
    router.replace('/(auth)/login')
  }

  return (
    <AuthScaffold
      title='Verify your email'
      description={`Open the verification link sent to ${user?.email ?? 'your email address'}, then return here.`}
    >
      <View style={authStyles.form}>
        <View
          style={[authStyles.notice, { backgroundColor: theme.primaryLight }]}
        >
          <Text style={[authStyles.noticeText, { color: theme.text }]}>
            Protected screens stay locked until Firebase confirms the address.
          </Text>
        </View>
        {message ? (
          <Text
            accessibilityRole='alert'
            style={[authStyles.error, { color: theme.success }]}
          >
            {message}
          </Text>
        ) : null}
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
          disabled={isWorking}
          onPress={() => void checkVerification()}
          style={[authStyles.button, { backgroundColor: theme.primary }]}
        >
          {isWorking ? (
            <ActivityIndicator color='#FFFFFF' />
          ) : (
            <Text style={authStyles.buttonText}>I have verified my email</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole='button'
          disabled={isWorking}
          onPress={() => void resend()}
          style={authStyles.secondaryButton}
        >
          <Text style={[authStyles.link, { color: theme.primary }]}>
            Send another verification email
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole='button'
          disabled={isWorking}
          onPress={() => void useAnotherAccount()}
          style={authStyles.secondaryButton}
        >
          <Text style={[authStyles.link, { color: theme.textSecondary }]}>
            Use another account
          </Text>
        </TouchableOpacity>
      </View>
    </AuthScaffold>
  )
}
