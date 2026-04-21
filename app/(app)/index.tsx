// app/(app)/index.tsx
import { useAuth } from '@/contexts/AuthContext'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
  const { user, isInitialized } = useAuth()

  useEffect(() => {
    if (!isInitialized) return
    if (user) {
      router.replace('/(app)/home')
    } else {
      router.replace('/(auth)/login')
    }
  }, [user, isInitialized])

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
