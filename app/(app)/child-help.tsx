import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { BD_HOTLINES } from '@/constants/hotlines'
import { useTheme } from '@/contexts/ThemeContext'
import { openDialer } from '@/services/hotlineService'
import { Hotline } from '@/types'

const CHILD_NUMBERS = ['1098', '999']

export default function ChildHelpScreen() {
  const { theme } = useTheme()
  const [busyNumber, setBusyNumber] = useState<string | null>(null)

  const callHotline = async (hotline: Hotline): Promise<void> => {
    setBusyNumber(hotline.number)
    const result = await openDialer(hotline.number)
    setBusyNumber(null)

    if (result.status !== 'opened') {
      Alert.alert(`${hotline.name} unavailable`, result.reason)
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole='button'
          accessibilityLabel='Back'
          onPress={() => router.back()}
          style={[styles.backButton, { borderColor: theme.border }]}
        >
          <Ionicons name='arrow-back' size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, { color: theme.primary }]}>
            Child help
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Simple help choices
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Calm wording and direct calls only. A guardian is never contacted
            automatically.
          </Text>
        </View>
      </View>

      <View style={[styles.notice, { backgroundColor: theme.primaryLight }]}>
        <Ionicons name='hand-left-outline' size={20} color={theme.primary} />
        <Text style={[styles.noticeText, { color: theme.text }]}>
          Tap one of these buttons to open the phone app. If you are in danger,
          use the emergency number first.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Call now
        </Text>
        <View style={styles.quickRow}>
          {CHILD_NUMBERS.map((number) => {
            const hotline = BD_HOTLINES.find((item) => item.number === number)
            if (!hotline) return null
            const isBusy = busyNumber === number
            return (
              <TouchableOpacity
                key={number}
                accessibilityRole='button'
                accessibilityLabel={`Call ${hotline.name}`}
                onPress={() => void callHotline(hotline)}
                disabled={Boolean(busyNumber)}
                style={[
                  styles.quickButton,
                  { backgroundColor: theme.primary, opacity: isBusy ? 0.7 : 1 },
                ]}
              >
                {isBusy ? (
                  <ActivityIndicator color='#FFFFFF' />
                ) : (
                  <Text style={styles.quickButtonText}>{number}</Text>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          If talking is hard
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          1. Use the shortest button that feels safe.
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          2. Show the phone to a safe adult if you cannot speak.
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          3. RedDot does not store the call outcome.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  header: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerCopy: { flex: 1, gap: 6 },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { fontSize: 26, fontWeight: '800', lineHeight: 32 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  notice: { flexDirection: 'row', gap: 10, borderRadius: 16, padding: 16 },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  card: { gap: 12, borderRadius: 18, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  quickRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  quickButton: {
    minWidth: 84,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  quickButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  body: { fontSize: 14, lineHeight: 20 },
})
