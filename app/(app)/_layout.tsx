import { hasAppPin } from '@/services/secureStorage'
import { Stack, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

export default function AppLayout() {
  const [isCheckingSetup, setIsCheckingSetup] = useState(true)

  useEffect(() => {
    let isMounted = true

    hasAppPin().then((isSetUp) => {
      if (!isMounted) return
      if (!isSetUp) {
        router.replace('/(onboarding)')
        return
      }
      setIsCheckingSetup(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  if (isCheckingSetup) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color='#C0392B' size='large' />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='home' />
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
