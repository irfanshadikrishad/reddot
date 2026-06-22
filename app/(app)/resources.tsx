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
import { SafeAreaView } from 'react-native-safe-area-context'

import { REVIEWED_SAFE_SPACES } from '@/constants/resources'
import { useTheme } from '@/contexts/ThemeContext'
import { openDialer } from '@/services/hotlineService'
import { requestOneTimeLocation } from '@/services/locationService'
import {
  filterResourcesByType,
  formatApproximateDistance,
  resourceTypeLabel,
  sortResourcesAlphabetically,
  sortResourcesByDistance,
  ResourceSortMode,
} from '@/services/resourceService'
import { BundledSafeSpace, SafeSpaceType } from '@/types'

const RESOURCE_TYPES: Array<SafeSpaceType | 'all'> = [
  'all',
  'shelter',
  'hospital',
  'police',
  'legal',
  'counseling',
  'childcare',
]

export default function ResourcesScreen() {
  const { theme } = useTheme()
  const [selectedType, setSelectedType] = useState<SafeSpaceType | 'all'>('all')
  const [sortMode, setSortMode] = useState<ResourceSortMode>('default')
  const [distanceLocation, setDistanceLocation] = useState<
    Awaited<ReturnType<typeof requestOneTimeLocation>> | null
  >(null)
  const [busyNumber, setBusyNumber] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isSortingByDistance, setIsSortingByDistance] = useState(false)

  const filteredResources = useMemo(() => {
    const byType = filterResourcesByType(REVIEWED_SAFE_SPACES, selectedType)
    if (sortMode === 'distance' && distanceLocation?.ok) {
      return sortResourcesByDistance(byType, distanceLocation.value)
    }
    return sortResourcesAlphabetically(byType)
  }, [distanceLocation, selectedType, sortMode])

  const callResource = async (resource: BundledSafeSpace): Promise<void> => {
    if (!resource.phone) return
    setBusyNumber(resource.phone)
    const result = await openDialer(resource.phone)
    setBusyNumber(null)

    if (result.status === 'opened') return
    Alert.alert(resource.name + ' unavailable', result.reason)
  }

  const enableDistanceSort = async (): Promise<void> => {
    setError('')
    setStatus('')
    setIsSortingByDistance(true)
    const result = await requestOneTimeLocation()
    setIsSortingByDistance(false)
    setDistanceLocation(result)

    if (!result.ok) {
      setSortMode('default')
      setError(result.error)
      return
    }

    setSortMode('distance')
    setStatus('Sorted by approximate distance using one-time location only. The location was not saved.')
  }

  const disableDistanceSort = (): void => {
    setSortMode('default')
    setStatus('Showing the offline reviewed list.')
    setError('')
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
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
            <Text style={[styles.kicker, { color: theme.primary }]}>Resources</Text>
            <Text style={[styles.title, { color: theme.text }]}>Reviewed safe spaces</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Browse offline support locations and contacts with source and verification details. Nothing here claims live availability.</Text>
          </View>
        </View>

        <View style={[styles.notice, { backgroundColor: theme.primaryLight }]}> 
          <Ionicons name='shield-checkmark-outline' size={20} color={theme.primary} />
          <Text style={[styles.noticeText, { color: theme.text }]}>These entries are bundled with the app. Precise user location is only requested if you choose distance sorting, and it is not saved.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Filters</Text>
            <Text style={[styles.sectionMeta, { color: theme.textSecondary }]}>{filteredResources.length} shown</Text>
          </View>
          <View style={styles.filterRow}>
            {RESOURCE_TYPES.map((type) => {
              const selected = selectedType === type
              return (
                <TouchableOpacity
                  key={type}
                  accessibilityRole='button'
                  accessibilityLabel={type === 'all' ? 'Show all resources' : 'Show ' + resourceTypeLabel(type)}
                  onPress={() => setSelectedType(type)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selected ? theme.primary : theme.surfaceSecondary,
                      borderColor: selected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.filterChipText, { color: selected ? '#FFFFFF' : theme.text }]}>
                    {type === 'all' ? 'All' : resourceTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              accessibilityRole='button'
              accessibilityLabel='Sort by distance'
              onPress={() => void enableDistanceSort()}
              disabled={isSortingByDistance}
              style={[styles.secondaryButton, { borderColor: theme.primary, backgroundColor: theme.surface }]}
            >
              {isSortingByDistance ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Sort by distance</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole='button'
              accessibilityLabel='Show offline list'
              onPress={disableDistanceSort}
              style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Offline list</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>Distance sorting is approximate and uses one-time foreground location only. The exact coordinates are not kept after the screen closes.</Text>
          {error ? <Text accessibilityRole='alert' style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
          {status ? <Text style={[styles.status, { color: theme.success }]}>{status}</Text> : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Offline list</Text>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>Each card shows the source and verification date. No card claims a live open/closed state.</Text>
          <View style={styles.list}>
            {filteredResources.map((resource) => {
              const isBusy = busyNumber === resource.phone
              return (
                <View key={resource.id} style={[styles.resourceCard, { borderColor: theme.border, backgroundColor: theme.background }]}> 
                  <View style={styles.resourceHeader}>
                    <View style={styles.resourceCopy}>
                      <Text style={[styles.resourceName, { color: theme.text }]}>{resource.name}</Text>
                      <Text style={[styles.resourceType, { color: theme.primary }]}>{resourceTypeLabel(resource.type)}</Text>
                      <Text style={[styles.resourceBody, { color: theme.textSecondary }]}>{resource.area} • {resource.hours}</Text>
                      <Text style={[styles.meta, { color: theme.textMuted }]}>Source: {resource.sourceName}</Text>
                      <Text style={[styles.meta, { color: theme.textMuted }]}>Verified: {resource.verificationStatus} • {resource.lastVerifiedAt}</Text>
                      {sortMode === 'distance' && distanceLocation?.ok ? <Text style={[styles.meta, { color: theme.textMuted }]}>{formatApproximateDistance(resource.distanceKm ?? 0)}</Text> : null}
                    </View>
                    <TouchableOpacity
                      accessibilityRole='button'
                      accessibilityLabel={'Call ' + resource.name}
                      onPress={() => void callResource(resource)}
                      disabled={!resource.phone || Boolean(busyNumber)}
                      style={[styles.callButton, { backgroundColor: theme.primary, opacity: isBusy ? 0.7 : 1 }]}
                    >
                      {isBusy ? (
                        <ActivityIndicator color='#FFFFFF' />
                      ) : (
                        <Text style={styles.callButtonText}>{resource.phone ? 'Call' : 'N/A'}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
  notice: { flexDirection: 'row', gap: 10, borderRadius: 16, padding: 16, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  card: { gap: 12, borderRadius: 18, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionMeta: { fontSize: 13, fontWeight: '700' },
  sectionBody: { fontSize: 14, lineHeight: 20 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: { fontSize: 13, fontWeight: '800' },
  buttonRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '800' },
  list: { gap: 10 },
  resourceCard: { borderWidth: 1, borderRadius: 16, padding: 14 },
  resourceHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  resourceCopy: { flex: 1, gap: 4 },
  resourceName: { fontSize: 16, fontWeight: '800' },
  resourceType: { fontSize: 13, fontWeight: '800' },
  resourceBody: { fontSize: 13, lineHeight: 18 },
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
  error: { fontSize: 14, lineHeight: 20 },
  status: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
})
