import { useAuth } from '@/contexts/AuthContext'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
  const { user, isInitializing } = useAuth()

  useEffect(() => {
    if (isInitializing) return
    router.replace(
      !user
        ? '/(auth)/login'
        : user.emailVerified
          ? '/(app)/home'
          : '/(auth)/verify-email'
    )
  }, [isInitializing, user])

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
