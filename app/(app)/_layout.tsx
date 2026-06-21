import { useAuth } from '@/contexts/AuthContext'
import { Stack, router } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

export default function AppLayout() {
  const { user, isInitializing } = useAuth()

  useEffect(() => {
    if (isInitializing) return
    if (!user) router.replace('/(auth)/login')
    else if (!user.emailVerified) router.replace('/(auth)/verify-email')
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
