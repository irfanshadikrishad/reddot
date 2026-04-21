// app/(app)/home.tsx
import { useAuth } from '@/contexts/AuthContext'
import { Button, StyleSheet, Text, View } from 'react-native'

export default function HomeScreen() {
  const { user, signOut } = useAuth()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RedDot - Safety Companion</Text>
      <Text style={styles.subtitle}>Welcome {user?.email}</Text>
      <Button title='Logout' onPress={signOut} color='#C0392B' />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
  },
  title: {
    fontSize: 24,
    color: '#C0392B',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 30,
  },
})
