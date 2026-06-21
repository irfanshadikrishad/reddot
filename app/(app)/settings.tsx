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
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { deleteAllLocalData } from '@/services/localDataService'

export default function PrivacySettingsScreen() {
  const { theme } = useTheme()
  const { signOut } = useAuth()
  const [isBusy, setIsBusy] = useState(false)

  const confirmDeletion = () => {
    Alert.alert(
      'Delete all local data?',
      'This permanently removes contacts, settings, and other protected RedDot data from this device. Your Firebase account is not deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: () => void handleDeletion(),
        },
      ]
    )
  }

  const handleDeletion = async () => {
    setIsBusy(true)
    const result = await deleteAllLocalData()
    setIsBusy(false)

    if (result.status === 'partial_failure') {
      Alert.alert(
        'Deletion incomplete',
        'Some local data could not be removed. Restart the app and try again before relying on deletion.'
      )
      return
    }

    Alert.alert('Local data deleted', 'Protected local records were removed.')
  }

  const confirmSignOut = () => {
    Alert.alert(
      'Sign out?',
      'Signing out removes protected local records from this device. Your Firebase account stays active.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => void handleSignOut(),
        },
      ]
    )
  }

  const handleSignOut = async () => {
    setIsBusy(true)
    const result = await signOut()
    setIsBusy(false)

    if (!result.ok) {
      Alert.alert('Sign-out incomplete', result.error)
      return
    }

    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Back to home'
            onPress={() => router.back()}
            style={[styles.iconButton, { borderColor: theme.border }]}
          >
            <Ionicons name='arrow-back' size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerCopy}>
            <Text style={[styles.kicker, { color: theme.primary }]}>
              Settings
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Privacy settings
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Manage device-only data and sign out of this phone.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole='button'
          accessibilityLabel='Open privacy lock setup'
          onPress={() => router.push('/(app)/privacy-lock')}
          style={[styles.setupButton, { backgroundColor: theme.surface }]}
        >
          <Ionicons
            name='lock-closed-outline'
            size={22}
            color={theme.primary}
          />
          <View style={styles.setupCopy}>
            <Text style={[styles.setupTitle, { color: theme.text }]}>
              Privacy lock setup
            </Text>
            <Text style={[styles.setupBody, { color: theme.textSecondary }]}>
              Add or review your PIN, fake PIN, biometric unlock, and decoy
              screen.
            </Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Ionicons
            name='phone-portrait-outline'
            size={28}
            color={theme.primary}
          />
          <View style={styles.cardCopy}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Device-only data
            </Text>
            <Text style={[styles.cardBody, { color: theme.textSecondary }]}>
              Safety records stay on this device and have no cloud recovery.
              Deleting them does not delete your Firebase account.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.actionCard,
            {
              backgroundColor: theme.surfaceSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.actionHeader}>
            <Ionicons name='log-out-outline' size={22} color={theme.danger} />
            <Text style={[styles.actionTitle, { color: theme.text }]}>
              Sign out
            </Text>
          </View>
          <Text style={[styles.actionBody, { color: theme.textSecondary }]}>
            Signing out clears protected local records from this device and
            returns you to the login screen.
          </Text>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Sign out'
            accessibilityHint='Signs out and clears protected local records from this device'
            onPress={confirmSignOut}
            disabled={isBusy}
            style={[
              styles.dangerButton,
              { borderColor: theme.danger, backgroundColor: theme.surface },
            ]}
          >
            {isBusy ? (
              <ActivityIndicator color={theme.danger} />
            ) : (
              <Text style={[styles.dangerButtonText, { color: theme.danger }]}>
                Sign out
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.actionCard,
            {
              backgroundColor: theme.surfaceSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.actionHeader}>
            <Ionicons name='trash-outline' size={22} color={theme.danger} />
            <Text style={[styles.actionTitle, { color: theme.text }]}>
              Delete local data
            </Text>
          </View>
          <Text style={[styles.actionBody, { color: theme.textSecondary }]}>
            Remove the protected data from this device while staying signed in.
          </Text>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Delete all local data'
            accessibilityHint='Permanently removes protected RedDot data from this device'
            onPress={confirmDeletion}
            disabled={isBusy}
            style={[
              styles.deleteButton,
              { borderColor: theme.danger, backgroundColor: theme.surface },
            ]}
          >
            {isBusy ? (
              <ActivityIndicator color={theme.danger} />
            ) : (
              <Text style={[styles.deleteText, { color: theme.danger }]}>
                Delete all local data
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  iconButton: {
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
  setupButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 16,
    padding: 16,
  },
  setupCopy: { flex: 1, gap: 4 },
  setupTitle: { fontSize: 16, fontWeight: '800' },
  setupBody: { fontSize: 14, lineHeight: 20 },
  card: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12 },
  cardCopy: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardBody: { fontSize: 14, lineHeight: 20 },
  actionCard: {
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  actionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionTitle: { fontSize: 16, fontWeight: '800' },
  actionBody: { fontSize: 14, lineHeight: 20 },
  deleteButton: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteText: { fontSize: 16, fontWeight: '700' },
  dangerButton: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dangerButtonText: { fontSize: 16, fontWeight: '700' },
})
