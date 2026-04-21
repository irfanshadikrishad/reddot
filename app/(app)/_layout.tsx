// app/(app)/_layout.tsx
import { Stack, router, useRootNavigationState } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'

function AppLayoutContent() {
  const { user, isLoading } = useAuth()
  const rootNavigationState = useRootNavigationState()

  useEffect(() => {
    // Wait for navigation to be ready
    if (!rootNavigationState?.key) return

    if (!isLoading && !user) {
      router.replace('/(auth)/login')
    }
  }, [user, isLoading, rootNavigationState?.key])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' color='#C0392B' />
      </View>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='home' />
      <Stack.Screen name='map' />
      <Stack.Screen name='chat' />
      <Stack.Screen name='journal' />
      <Stack.Screen name='resources' />
      <Stack.Screen name='community' />
      <Stack.Screen name='children' />
      <Stack.Screen name='settings' />
    </Stack>
  )
}

export default function AppLayout() {
  return <AppLayoutContent />
}
