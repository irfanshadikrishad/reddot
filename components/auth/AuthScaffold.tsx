import { Ionicons } from '@expo/vector-icons'
import { ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'

export function AuthScaffold({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  const { theme } = useTheme()
  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.background },
        ]}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.header}>
          <Ionicons name='shield-checkmark' size={48} color={theme.primary} />
          <Text style={[styles.brand, { color: theme.primary }]}>RedDot</Text>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {description}
          </Text>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export const authStyles = StyleSheet.create({
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: { fontSize: 14, lineHeight: 20 },
  button: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  link: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  footerText: { fontSize: 15 },
  notice: { padding: 14, borderRadius: 12 },
  noticeText: { fontSize: 14, lineHeight: 20 },
})

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 28,
  },
  header: { alignItems: 'center', gap: 7 },
  brand: { fontSize: 28, fontWeight: '900' },
  title: { fontSize: 26, fontWeight: '800', marginTop: 10 },
  description: {
    maxWidth: 420,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
})
