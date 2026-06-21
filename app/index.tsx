import { hasAppPin } from '@/services/secureStorage'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
  useEffect(() => {
    let isMounted = true

    hasAppPin().then((isSetUp) => {
      if (!isMounted) return
      router.replace(isSetUp ? '/(app)/home' : '/(onboarding)')
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0D0D0D',
      }}
    >
      <ActivityIndicator color='#C0392B' size='large' />
    </View>
  )
}
