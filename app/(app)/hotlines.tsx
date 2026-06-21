import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
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
import { groupHotlinesByCategory, openDialer } from '@/services/hotlineService'
import { Hotline } from '@/types'

export default function HotlinesScreen() {
  const { theme } = useTheme()
  const groups = useMemo(() => groupHotlinesByCategory(), [])
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
            Hotlines
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Bangladesh help numbers
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Reviewed numbers are stored locally and work without the network.
          </Text>
        </View>
      </View>

      <View style={[styles.notice, { backgroundColor: theme.primaryLight }]}>
        <Ionicons name='call-outline' size={20} color={theme.primary} />
        <Text style={[styles.noticeText, { color: theme.text }]}>
          Opening the dialer does not mean the call connected. RedDot only knows
          that the phone app was opened or was unavailable.
        </Text>
      </View>

      {groups.map((group) => (
        <View
          key={group.category}
          style={[styles.card, { backgroundColor: theme.surface }]}
        >
          <Text style={[styles.groupTitle, { color: theme.text }]}>
            {group.label}
          </Text>
          {group.hotlines.map((hotline) => {
            const isBusy = busyNumber === hotline.number
            return (
              <View
                key={hotline.id}
                style={[styles.hotlineRow, { borderColor: theme.border }]}
              >
                <View style={styles.hotlineCopy}>
                  <Text style={[styles.hotlineName, { color: theme.text }]}>
                    {hotline.name}
                  </Text>
                  <Text
                    style={[styles.hotlineNumber, { color: theme.primary }]}
                  >
                    {hotline.number}
                  </Text>
                  <Text
                    style={[styles.hotlineBody, { color: theme.textSecondary }]}
                  >
                    {hotline.description}
                  </Text>
                  <Text style={[styles.meta, { color: theme.textMuted }]}>
                    Source: {hotline.sourceName} • Verified{' '}
                    {hotline.lastVerifiedAt}
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityRole='button'
                  accessibilityLabel={`Call ${hotline.name}`}
                  onPress={() => void callHotline(hotline)}
                  disabled={Boolean(busyNumber)}
                  style={[
                    styles.callButton,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  {isBusy ? (
                    <ActivityIndicator color='#FFFFFF' />
                  ) : (
                    <Text style={styles.callButtonText}>Call</Text>
                  )}
                </TouchableOpacity>
              </View>
            )
          })}
        </View>
      ))}

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.groupTitle, { color: theme.text }]}>
          Complete bundle
        </Text>
        <Text style={[styles.hotlineBody, { color: theme.textSecondary }]}>
          {BD_HOTLINES.length} hotline entries are bundled with the app for
          offline browsing.
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
  groupTitle: { fontSize: 18, fontWeight: '800' },
  hotlineRow: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
  },
  hotlineCopy: { flex: 1, gap: 4 },
  hotlineName: { fontSize: 16, fontWeight: '800' },
  hotlineNumber: { fontSize: 14, fontWeight: '800' },
  hotlineBody: { fontSize: 13, lineHeight: 18 },
  meta: { fontSize: 12, lineHeight: 16 },
  callButton: {
    minWidth: 76,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
})
