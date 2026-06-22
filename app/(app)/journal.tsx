import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import {
  deleteBackupExportFile,
  prepareBackupExportFile,
} from '@/services/exportFileService'
import { createJournalBackup } from '@/services/journalExportService'
import {
  deleteJournalEntry,
  getJournalEntries,
  saveJournalEntry,
} from '@/services/journalRepository'
import { JournalEntry, JournalEntryInput, JournalTimelineFilter } from '@/types'

type JournalForm = {
  title: string
  content: string
  mood: JournalEntryInput['mood'] | ''
  tags: string
}

const EMPTY_FORM: JournalForm = {
  title: '',
  content: '',
  mood: '',
  tags: '',
}

const FILTER_OPTIONS: Array<{ label: string; value: JournalTimelineFilter }> = [
  { label: 'All', value: 'all' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
]

const MOOD_OPTIONS: Array<{ label: string; value: JournalEntryInput['mood'] }> =
  [
    { label: 'Safe', value: 'safe' },
    { label: 'Anxious', value: 'anxious' },
    { label: 'Scared', value: 'scared' },
    { label: 'Hopeful', value: 'hopeful' },
    { label: 'Neutral', value: 'neutral' },
  ]

function splitTags(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function joinTags(tags: string[]): string {
  return tags.join('\n')
}

function formFromEntry(entry: JournalEntry | null): JournalForm {
  if (!entry) return EMPTY_FORM
  return {
    title: entry.title,
    content: entry.content,
    mood: entry.mood ?? '',
    tags: joinTags(entry.tags),
  }
}

function inputFromForm(uid: string, form: JournalForm): JournalEntryInput {
  return {
    uid,
    title: form.title,
    content: form.content,
    mood: form.mood || undefined,
    tags: splitTags(form.tags),
  }
}

function formatEntryDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

function formatMood(mood?: JournalEntry['mood']): string {
  if (!mood) return 'No mood selected'
  return mood.charAt(0).toUpperCase() + mood.slice(1)
}

export default function JournalScreen() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const uid = user?.uid ?? 'local'
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [form, setForm] = useState<JournalForm>(EMPTY_FORM)
  const [filter, setFilter] = useState<JournalTimelineFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportPassphrase, setExportPassphrase] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
    [entries, selectedEntryId]
  )

  const loadEntries = async (
    activeFilter: JournalTimelineFilter = filter
  ): Promise<void> => {
    setIsLoading(true)
    const result = await getJournalEntries(activeFilter)
    if (!result.ok) {
      setError(result.error.message)
      setIsLoading(false)
      return
    }

    setEntries(result.value)
    const selectedStillVisible =
      selectedEntryId !== null &&
      result.value.some((entry) => entry.id === selectedEntryId)

    if (!selectedStillVisible) {
      if (result.value.length > 0) {
        const latest = result.value[0]
        setSelectedEntryId(latest.id)
        setForm(formFromEntry(latest))
      } else {
        setSelectedEntryId(null)
        setForm(EMPTY_FORM)
      }
    }

    setIsLoading(false)
  }

  useEffect(() => {
    void loadEntries(filter)
  }, [filter])

  const resetToNewEntry = (): void => {
    setSelectedEntryId(null)
    setForm(EMPTY_FORM)
    setStatus('Ready for a new encrypted entry.')
    setError('')
  }

  const openEntry = (entry: JournalEntry): void => {
    setSelectedEntryId(entry.id)
    setForm(formFromEntry(entry))
    setError('')
    setStatus('Loaded an encrypted journal entry.')
  }

  const saveEntry = async (): Promise<void> => {
    setError('')
    setStatus('')
    setIsSaving(true)

    const result = await saveJournalEntry(
      inputFromForm(uid, form),
      selectedEntryId ?? undefined
    )

    if (!result.ok) {
      setError(result.error.message)
      setIsSaving(false)
      return
    }

    setSelectedEntryId(result.value.id)
    setForm(formFromEntry(result.value))
    setStatus('Journal entry saved locally and encrypted.')
    await loadEntries(filter)
    setIsSaving(false)
  }

  const confirmDelete = async (): Promise<void> => {
    if (!selectedEntryId) return

    setIsDeleting(true)
    const result = await deleteJournalEntry(selectedEntryId)
    if (!result.ok) {
      setError(result.error.message)
      setIsDeleting(false)
      return
    }

    setStatus('Journal entry deleted from this device.')
    setSelectedEntryId(null)
    setForm(EMPTY_FORM)
    await loadEntries(filter)
    setIsDeleting(false)
  }

  const deleteEntry = (): void => {
    if (!selectedEntryId) {
      setError('Select an entry before deleting it.')
      return
    }

    Alert.alert(
      'Delete journal entry?',
      'Remove the encrypted entry from this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void confirmDelete(),
        },
      ]
    )
  }

  const exportEntries = async (): Promise<void> => {
    setError('')
    if (!exportPassphrase.trim()) {
      setError('Enter a backup passphrase first.')
      return
    }

    setIsExporting(true)
    let backupFile: string | null = null
    const result = await getJournalEntries('all')
    if (!result.ok) {
      setError(result.error.message)
      setIsExporting(false)
      return
    }

    const backup = await createJournalBackup(result.value, exportPassphrase)
    if (!backup.ok) {
      setError(backup.error.message)
      setIsExporting(false)
      return
    }

    const prepared = await prepareBackupExportFile(
      'reddot-journal-backup',
      backup.value
    )
    if (!prepared.ok) {
      setError(prepared.error.message)
      setIsExporting(false)
      return
    }

    backupFile = prepared.value

    try {
      await Share.share({
        title: 'RedDot journal export',
        url: backupFile ?? undefined,
      })
      setStatus('Encrypted journal backup file is ready to save or share.')
    } catch {
      setStatus('The share sheet could not be opened.')
    } finally {
      await deleteBackupExportFile(backupFile)
      setIsExporting(false)
    }
  }

  const renderFilterChip = (option: {
    label: string
    value: JournalTimelineFilter
  }) => {
    const selected = filter === option.value
    return (
      <TouchableOpacity
        key={option.value}
        accessibilityRole='button'
        accessibilityLabel={option.label}
        onPress={() => setFilter(option.value)}
        style={[
          styles.filterChip,
          {
            backgroundColor: selected ? theme.primary : theme.surfaceSecondary,
            borderColor: selected ? theme.primary : theme.border,
          },
        ]}
      >
        <Text
          style={[
            styles.filterChipText,
            { color: selected ? '#FFFFFF' : theme.text },
          ]}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps='handled'
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
              Journal
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Encrypted private notes
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Write and review entries on this device. Titles and content stay
              encrypted at rest.
            </Text>
          </View>
        </View>

        <View style={[styles.notice, { backgroundColor: theme.primaryLight }]}>
          <Ionicons
            name='shield-checkmark-outline'
            size={20}
            color={theme.primary}
          />
          <Text style={[styles.noticeText, { color: theme.text }]}>
            Media attachment controls stay disabled until Phase 3.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Timeline
            </Text>
            <Text style={[styles.sectionMeta, { color: theme.textSecondary }]}>
              {entries.length} entries
            </Text>
          </View>
          <View style={styles.filterRow}>
            {FILTER_OPTIONS.map(renderFilterChip)}
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            Filter by time only. Journal content is never stored in searchable
            plain-text indexes.
          </Text>
          {isLoading ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Loading entries...
            </Text>
          ) : entries.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No journal entries yet. Create one below.
            </Text>
          ) : (
            <View style={styles.entryList}>
              {entries.map((entry) => {
                const selected = entry.id === selectedEntryId
                return (
                  <TouchableOpacity
                    key={entry.id}
                    accessibilityRole='button'
                    accessibilityLabel={'Open ' + entry.title}
                    onPress={() => openEntry(entry)}
                    style={[
                      styles.entryItem,
                      {
                        backgroundColor: selected
                          ? theme.primaryLight
                          : theme.background,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.entryItemHeader}>
                      <Text
                        style={[styles.entryItemTitle, { color: theme.text }]}
                      >
                        {entry.title}
                      </Text>
                      <Text
                        style={[
                          styles.entryItemDate,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {formatEntryDate(entry.updatedAt)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.entryItemMeta,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {formatMood(entry.mood)}
                    </Text>
                    <Text
                      style={[
                        styles.entryItemMeta,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {entry.tags.length > 0
                        ? entry.tags.join(' • ')
                        : 'No tags'}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Entry
            </Text>
            <TouchableOpacity
              onPress={resetToNewEntry}
              accessibilityRole='button'
              accessibilityLabel='New entry'
            >
              <Text style={[styles.sectionLink, { color: theme.primary }]}>
                New entry
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            A selected entry opens here for review or editing.
          </Text>
          <TextInput
            accessibilityLabel='Entry title'
            placeholder='Entry title'
            placeholderTextColor={theme.textMuted}
            value={form.title}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, title: value }))
            }
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border },
            ]}
          />
          <View style={styles.moodRow}>
            {MOOD_OPTIONS.map((option) => {
              const selected = form.mood === option.value
              return (
                <TouchableOpacity
                  key={option.label}
                  accessibilityRole='button'
                  accessibilityLabel={option.label}
                  onPress={() =>
                    setForm((current) => ({ ...current, mood: option.value }))
                  }
                  style={[
                    styles.moodChip,
                    {
                      backgroundColor: selected
                        ? theme.primary
                        : theme.surfaceSecondary,
                      borderColor: selected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.moodChipText,
                      { color: selected ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
          <TextInput
            accessibilityLabel='Entry content'
            placeholder='Write your entry here'
            placeholderTextColor={theme.textMuted}
            value={form.content}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, content: value }))
            }
            multiline
            textAlignVertical='top'
            style={[
              styles.textArea,
              { color: theme.text, borderColor: theme.border },
            ]}
          />
          <TextInput
            accessibilityLabel='Entry tags'
            placeholder='Tags, one per line'
            placeholderTextColor={theme.textMuted}
            value={form.tags}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, tags: value }))
            }
            multiline
            textAlignVertical='top'
            style={[
              styles.input,
              styles.tagsInput,
              { color: theme.text, borderColor: theme.border },
            ]}
          />
          <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
            Keep tags short. They are stored encrypted with the entry.
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              accessibilityRole='button'
              accessibilityLabel='Save journal entry'
              onPress={() => void saveEntry()}
              disabled={isSaving}
              style={[
                styles.primaryButton,
                { backgroundColor: theme.primary, opacity: isSaving ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {isSaving ? 'Saving...' : 'Save entry'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole='button'
              accessibilityLabel='Delete journal entry'
              onPress={deleteEntry}
              disabled={isDeleting || !selectedEntryId}
              style={[styles.secondaryButton, { borderColor: theme.danger }]}
            >
              <Text
                style={[styles.secondaryButtonText, { color: theme.danger }]}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
          {selectedEntry ? (
            <Text style={[styles.selectedMeta, { color: theme.textSecondary }]}>
              Selected entry: {selectedEntry.title} •{' '}
              {formatEntryDate(selectedEntry.updatedAt)}
            </Text>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Media attachments
          </Text>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            Attachment controls stay disabled until encrypted private-file
            handling lands in Phase 3.
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              disabled
              style={[styles.disabledButton, { borderColor: theme.border }]}
            >
              <Text
                style={[styles.disabledButtonText, { color: theme.textMuted }]}
              >
                Add photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled
              style={[styles.disabledButton, { borderColor: theme.border }]}
            >
              <Text
                style={[styles.disabledButtonText, { color: theme.textMuted }]}
              >
                Add audio
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Export
          </Text>
          <View
            style={[styles.notice, { backgroundColor: theme.surfaceSecondary }]}
          >
            <Ionicons name='warning-outline' size={20} color={theme.primary} />
            <Text style={[styles.noticeText, { color: theme.text }]}>
              An exported copy leaves RedDot protection. Use a passphrase you
              can keep separate from the app.
            </Text>
          </View>
          <TextInput
            accessibilityLabel='Journal export passphrase'
            placeholder='Export passphrase'
            placeholderTextColor={theme.textMuted}
            value={exportPassphrase}
            onChangeText={setExportPassphrase}
            secureTextEntry
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border },
            ]}
          />
          {error ? (
            <Text
              accessibilityRole='alert'
              style={[styles.error, { color: theme.danger }]}
            >
              {error}
            </Text>
          ) : null}
          {status ? (
            <Text style={[styles.status, { color: theme.success }]}>
              {status}
            </Text>
          ) : null}
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Export encrypted journal'
            onPress={() => void exportEntries()}
            disabled={isExporting}
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.primary,
                opacity: isExporting ? 0.7 : 1,
              },
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isExporting ? 'Preparing...' : 'Export encrypted copy'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
  },
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
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  notice: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  card: {
    gap: 12,
    borderRadius: 18,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionMeta: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  entryList: {
    gap: 10,
  },
  entryItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  entryItemHeader: {
    gap: 4,
  },
  entryItemTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  entryItemDate: {
    fontSize: 12,
    fontWeight: '700',
  },
  entryItemMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 180,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  tagsInput: {
    minHeight: 84,
  },
  fieldHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  disabledButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexGrow: 1,
    opacity: 0.6,
  },
  disabledButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  selectedMeta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
  status: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
})
