import { useTheme } from '@/contexts/ThemeContext'
import { StyleSheet, Text, View } from 'react-native'

export default function HomeScreen() {
  const { theme } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primary }]}>RedDot</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Local setup is complete. The safety dashboard is the next Phase 1
        milestone.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 23,
  },
})
