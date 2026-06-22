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

import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import {
  deleteBackupExportFile,
  prepareBackupExportFile,
} from '@/services/exportFileService'
import {
  createSafetyPlanBackup,
  restoreSafetyPlanBackupFromFile,
} from '@/services/exportService'
import {
  deleteSafetyPlan,
  getSafetyPlan,
  saveSafetyPlan,
} from '@/services/safetyPlanRepository'
import { SafetyPlan, SafetyPlanInput } from '@/types'

type SafetyPlanForm = {
  triggerSigns: string
  safePersons: string
  safeLocations: string
  importantDocuments: string
  exitSteps: string
  escapeBagItems: string
  codeWord: string
  localResources: string
}

const EMPTY_FORM: SafetyPlanForm = {
  triggerSigns: '',
  safePersons: '',
  safeLocations: '',
  importantDocuments: '',
  exitSteps: '',
  escapeBagItems: '',
  codeWord: '',
  localResources: '',
}

function joinLines(items: string[]): string {
  return items.join('\n')
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function formFromPlan(plan: SafetyPlan | null): SafetyPlanForm {
  if (!plan) return EMPTY_FORM
  return {
    triggerSigns: joinLines(plan.triggerSigns),
    safePersons: joinLines(plan.safePersons),
    safeLocations: joinLines(plan.safeLocations),
    importantDocuments: joinLines(plan.importantDocuments),
    exitSteps: joinLines(plan.exitSteps),
    escapeBagItems: joinLines(plan.escapeBagItems),
    codeWord: plan.codeWord ?? '',
    localResources: joinLines(plan.localResources),
  }
}

function planFromForm(uid: string, form: SafetyPlanForm): SafetyPlanInput {
  return {
    uid,
    triggerSigns: splitLines(form.triggerSigns),
    safePersons: splitLines(form.safePersons),
    safeLocations: splitLines(form.safeLocations),
    importantDocuments: splitLines(form.importantDocuments),
    exitSteps: splitLines(form.exitSteps),
    escapeBagItems: splitLines(form.escapeBagItems),
    codeWord: form.codeWord.trim(),
    localResources: splitLines(form.localResources),
  }
}

export default function SafetyPlanScreen() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const uid = user?.uid ?? 'local'
  const [form, setForm] = useState<SafetyPlanForm>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [backupPassphrase, setBackupPassphrase] = useState('')
  const [savedPlan, setSavedPlan] = useState<SafetyPlan | null>(null)

  const updatedLabel = useMemo(() => {
    if (!savedPlan) return 'No saved plan yet.'
    return `Last saved ${new Date(savedPlan.updatedAt).toLocaleString()}`
  }, [savedPlan])

  const loadPlan = async (): Promise<void> => {
    setIsLoading(true)
    const result = await getSafetyPlan()
    if (!result.ok) {
      setError(result.error.message)
      setIsLoading(false)
      return
    }

    setSavedPlan(result.value)
    setForm(formFromPlan(result.value))
    setError('')
    setStatus(
      result.value
        ? 'Loaded your local safety plan.'
        : 'Create your local safety plan below.'
    )
    setIsLoading(false)
  }

  useEffect(() => {
    void loadPlan()
  }, [])

  const savePlan = async (): Promise<void> => {
    setError('')
    setStatus('')
    setIsSaving(true)
    const result = await saveSafetyPlan(planFromForm(uid, form))
    if (!result.ok) {
      setError(result.error.message)
      setIsSaving(false)
      return
    }
    setSavedPlan(result.value)
    setForm(formFromPlan(result.value))
    setStatus('Safety plan saved locally and encrypted.')
    setIsSaving(false)
  }

  const confirmDelete = async (): Promise<void> => {
    setIsSaving(true)
    const result = await deleteSafetyPlan()
    if (!result.ok) {
      setError(result.error.message)
      setIsSaving(false)
      return
    }
    setSavedPlan(null)
    setForm(EMPTY_FORM)
    setStatus('Safety plan deleted from this device.')
    setIsSaving(false)
  }

  const removePlan = async (): Promise<void> => {
    Alert.alert(
      'Delete safety plan?',
      'Remove the encrypted safety plan from this device?',
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

  const exportBackup = async (): Promise<void> => {
    setError('')
    if (!backupPassphrase.trim()) {
      setError('Enter a backup passphrase first.')
      return
    }

    setIsExporting(true)
    let backupFile: string | null = null
    const draft = planFromForm(uid, form)
    const backup = await createSafetyPlanBackup(
      {
        ...draft,
        id: 'safety-plan',
        updatedAt: savedPlan?.updatedAt ?? Date.now(),
      },
      backupPassphrase
    )
    if (!backup.ok) {
      setError(backup.error.message)
      setIsExporting(false)
      return
    }

    const prepared = await prepareBackupExportFile(
      'reddot-safety-plan-backup',
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
        title: 'RedDot safety plan backup',
        url: backupFile ?? undefined,
      })
      setStatus(
        'Encrypted backup file is ready to save or share outside RedDot protection.'
      )
    } catch {
      setStatus('The share sheet could not be opened.')
    } finally {
      await deleteBackupExportFile(backupFile)
      setIsExporting(false)
    }
  }

  const importBackup = async (): Promise<void> => {
    setError('')
    if (!backupPassphrase.trim()) {
      setError('Enter the backup passphrase first.')
      return
    }

    setIsImporting(true)
    const result = await restoreSafetyPlanBackupFromFile(backupPassphrase)
    if (!result.ok) {
      setError(result.error.message)
      setIsImporting(false)
      return
    }

    setSavedPlan(result.value)
    setForm(formFromPlan(result.value))
    setStatus('Encrypted backup restored to this device.')
    setIsImporting(false)
  }

  const renderField = (
    label: string,
    key: keyof SafetyPlanForm,
    placeholder: string
  ) => (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        value={form[key]}
        onChangeText={(value) =>
          setForm((current) => ({ ...current, [key]: value }))
        }
        multiline
        textAlignVertical='top'
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
      />
      <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
        One item per line.
      </Text>
    </View>
  )

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
            Safety plan
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Encrypted local plan
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Store the checklist on the device, export it only when you choose,
            and keep the backup encrypted.
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
          The exported copy leaves RedDot protection when you share it. Use a
          passphrase you can keep separate from the plan.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Plan status
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {isLoading ? 'Loading your safety plan...' : updatedLabel}
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Keep the wording short and practical. This is a checklist for getting
          out and reaching help.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Preparation
        </Text>
        {renderField(
          'Warning signs',
          'triggerSigns',
          'Arguments, pressure, threats'
        )}
        {renderField(
          'Safe people',
          'safePersons',
          'Trusted friend, neighbor, relative'
        )}
        {renderField(
          'Safe places',
          'safeLocations',
          'Police station, clinic, shelter'
        )}
        {renderField(
          'Important documents',
          'importantDocuments',
          'NID, birth certificate, bank card'
        )}
        {renderField(
          'Exit steps',
          'exitSteps',
          'Leave, call, keep phone charged'
        )}
        {renderField(
          'Emergency bag',
          'escapeBagItems',
          'Clothes, medicine, charger'
        )}
        {renderField(
          'Local resources',
          'localResources',
          'Helpline, clinic, transport option'
        )}
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>
            Code word
          </Text>
          <TextInput
            accessibilityLabel='Code word'
            placeholder='Optional code word'
            placeholderTextColor={theme.textMuted}
            value={form.codeWord}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, codeWord: value }))
            }
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border },
            ]}
          />
        </View>
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
        <View style={styles.buttonRow}>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Save safety plan'
            onPress={() => void savePlan()}
            disabled={isSaving}
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.primary,
                opacity: isSaving ? 0.7 : 1,
              },
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isSaving ? 'Saving...' : 'Save plan'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Delete safety plan'
            onPress={() => void removePlan()}
            disabled={isSaving || isLoading}
            style={[styles.secondaryButton, { borderColor: theme.danger }]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.danger }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Encrypted backup
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Share the backup only if you intend to move this plan outside the app.
          A wrong passphrase or damaged file will not replace the current local
          plan.
        </Text>
        <TextInput
          accessibilityLabel='Backup passphrase'
          placeholder='Backup passphrase'
          placeholderTextColor={theme.textMuted}
          value={backupPassphrase}
          onChangeText={setBackupPassphrase}
          secureTextEntry
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.border },
          ]}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Export encrypted backup'
            onPress={() => void exportBackup()}
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
              {isExporting ? 'Preparing...' : 'Export backup'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel='Import encrypted backup'
            onPress={() => void importBackup()}
            disabled={isImporting}
            style={[styles.secondaryButton, { borderColor: theme.border }]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
              {isImporting ? 'Importing...' : 'Import backup'}
            </Text>
          </TouchableOpacity>
        </View>
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
  body: { fontSize: 14, lineHeight: 20 },
  fieldBlock: { gap: 8 },
  fieldLabel: { fontSize: 15, fontWeight: '800' },
  fieldHint: { fontSize: 12, lineHeight: 16 },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  buttonRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '800' },
  error: { fontSize: 14, lineHeight: 20 },
  status: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
})
