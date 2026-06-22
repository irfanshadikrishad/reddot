import { useAuth } from '@/contexts/AuthContext'
import { Stack, router } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

export default function AppLayout() {
  const { user, isInitializing } = useAuth()

  useEffect(() => {
    let cancelled = false
    const applyScreenCaptureProtection = async (): Promise<void> => {
      try {
        const ScreenCapture = await import('expo-screen-capture')
        if (cancelled) return
        await ScreenCapture.preventScreenCaptureAsync('protected-app')
      } catch {
        return
      }
    }

    void applyScreenCaptureProtection()

    if (isInitializing) return
    if (!user) router.replace('/(auth)/login')
    else if (!user.emailVerified) router.replace('/(auth)/verify-email')
    return () => {
      cancelled = true
      void import('expo-screen-capture')
        .then((ScreenCapture) => ScreenCapture.allowScreenCaptureAsync('protected-app'))
        .catch(() => undefined)
    }
  }, [isInitializing, user])

  if (isInitializing || !user || !user.emailVerified) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color='#C0392B' size='large' />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='home' />
      <Stack.Screen name='hotlines' />
      <Stack.Screen name='sos' />
      <Stack.Screen name='child-help' />
      <Stack.Screen name='trusted-contacts' />
      <Stack.Screen name='safety-plan' />
      <Stack.Screen name='journal' />
      <Stack.Screen name='resources' />
      <Stack.Screen name='reminders' />
      <Stack.Screen name='settings' />
      <Stack.Screen name='privacy-lock' />
    </Stack>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D0D',
  },
})
