import { router } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function AppIndex() {
  useEffect(() => {
    router.replace('/(app)/home')
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
