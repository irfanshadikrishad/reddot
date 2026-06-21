import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
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
import { hasAppPin } from '@/services/secureStorage'
import { Hotline } from '@/types'

const primaryHotlineNumbers = ['999', '10921', '1098']

export default function HomeScreen() {
  const { theme } = useTheme()
  const [hasLock, setHasLock] = useState<boolean | null>(null)
  const [busyNumber, setBusyNumber] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    void hasAppPin().then((value) => {
      if (mounted) setHasLock(value)
    })
    return () => {
      mounted = false
    }
  }, [])

  const hotlineGroups = useMemo(() => groupHotlinesByCategory(), [])

  const callHotline = async (hotline: Hotline): Promise<void> => {
    setBusyNumber(hotline.number)
    const result = await openDialer(hotline.number)
    setBusyNumber(null)

    if (result.status === 'opened') return

    Alert.alert(`${hotline.name} unavailable`, result.reason)
  }

  const quickCall = async (number: string): Promise<void> => {
    const hotline = BD_HOTLINES.find((item) => item.number === number)
    if (!hotline) return
    await callHotline(hotline)
  }

  const dashboardItems = [
    {
      label: 'SOS',
      description: 'Open the direct help screen.',
      icon: 'alert-circle-outline' as const,
      onPress: () => router.push('/(app)/sos'),
    },
    {
      label: 'Hotlines',
      description: 'Browse reviewed Bangladesh hotlines.',
      icon: 'call-outline' as const,
      onPress: () => router.push('/(app)/hotlines'),
    },
    {
      label: 'Trusted contacts',
      description: 'Prepare people you trust on this device.',
      icon: 'people-outline' as const,
      onPress: () => router.push('/(app)/trusted-contacts'),
    },
    {
      label: 'Safety plan',
      description: 'Review the plan you want to keep ready.',
      icon: 'document-text-outline' as const,
      onPress: () => router.push('/(app)/safety-plan'),
    },
    {
      label: 'Child help',
      description: 'Simple help path for a child.',
      icon: 'hand-left-outline' as const,
      onPress: () => router.push('/(app)/child-help'),
    },
  ]

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: theme.primary }]}>RedDot</Text>
        <Text style={[styles.title, { color: theme.text }]}>
          Safety dashboard
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Help is organized around the actions you can take now: direct calls,
          trusted people, and local guidance.
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
        <View style={styles.heroCopy}>
          <Ionicons name='alert-circle' size={28} color={theme.primary} />
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            Direct help
          </Text>
          <Text style={[styles.heroBody, { color: theme.textSecondary }]}>
            These buttons open the phone dialer. RedDot does not claim a call
            connected.
          </Text>
        </View>

        <View style={styles.quickRow}>
          {primaryHotlineNumbers.map((number) => {
            const hotline = BD_HOTLINES.find((item) => item.number === number)
            if (!hotline) return null
            const isBusy = busyNumber === number
            return (
              <TouchableOpacity
                key={number}
                accessibilityRole='button'
                accessibilityLabel={`Call ${hotline.name}`}
                onPress={() => void quickCall(number)}
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

      <View style={styles.grid}>
        {dashboardItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            accessibilityRole='button'
            accessibilityLabel={item.label}
            onPress={item.onPress}
            style={[styles.gridCard, { backgroundColor: theme.surface }]}
          >
            <Ionicons name={item.icon} size={22} color={theme.primary} />
            <Text style={[styles.gridTitle, { color: theme.text }]}>
              {item.label}
            </Text>
            <Text style={[styles.gridBody, { color: theme.textSecondary }]}>
              {item.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        accessibilityRole='button'
        accessibilityLabel={
          hasLock ? 'Review privacy lock' : 'Set up privacy lock'
        }
        onPress={() => router.push('/(app)/privacy-lock')}
        style={[styles.secondaryButton, { backgroundColor: theme.surface }]}
      >
        <Ionicons
          name='shield-checkmark-outline'
          size={22}
          color={theme.primary}
        />
        <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
          {hasLock ? 'Review privacy lock' : 'Set up privacy lock'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole='button'
        accessibilityLabel='Open privacy settings'
        onPress={() => router.push('/(app)/settings')}
        style={[styles.settingsButton, { backgroundColor: theme.surface }]}
      >
        <Ionicons name='settings-outline' size={22} color={theme.primary} />
        <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
          Privacy settings
        </Text>
      </TouchableOpacity>

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Hotlines
          </Text>
          <TouchableOpacity onPress={() => router.push('/(app)/hotlines')}>
            <Text style={[styles.sectionLink, { color: theme.primary }]}>
              Browse all
            </Text>
          </TouchableOpacity>
        </View>
        {hotlineGroups.map((group) => {
          const preview = group.hotlines.slice(0, 2)
          return (
            <View key={group.category} style={styles.groupBlock}>
              <Text style={[styles.groupTitle, { color: theme.text }]}>
                {group.label}
              </Text>
              <View style={styles.groupList}>
                {preview.map((hotline) => (
                  <TouchableOpacity
                    key={hotline.id}
                    accessibilityRole='button'
                    accessibilityLabel={`Call ${hotline.name}`}
                    onPress={() => void callHotline(hotline)}
                    style={[
                      styles.hotlineChip,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.hotlineName, { color: theme.text }]}>
                      {hotline.name}
                    </Text>
                    <Text
                      style={[styles.hotlineNumber, { color: theme.primary }]}
                    >
                      {hotline.number}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
  },
  header: { gap: 6, paddingTop: 10 },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { fontSize: 30, fontWeight: '900', lineHeight: 34 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  heroCard: {
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  heroCopy: { gap: 8 },
  heroTitle: { fontSize: 18, fontWeight: '800' },
  heroBody: { fontSize: 14, lineHeight: 20 },
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    minHeight: 132,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    justifyContent: 'flex-start',
  },
  gridTitle: { fontSize: 16, fontWeight: '800' },
  gridBody: { fontSize: 13, lineHeight: 18 },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '700' },
  settingsButton: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  section: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionLink: { fontSize: 14, fontWeight: '700' },
  groupBlock: { gap: 8 },
  groupTitle: { fontSize: 14, fontWeight: '800' },
  groupList: { gap: 8 },
  hotlineChip: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  hotlineName: { fontSize: 15, fontWeight: '700' },
  hotlineNumber: { fontSize: 14, fontWeight: '800' },
})
