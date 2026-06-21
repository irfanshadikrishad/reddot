import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'
import {
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from '@/services/contactRepository'
import { getSetting, setSetting } from '@/services/settingsRepository'
import { ContactInput, EmergencyContact } from '@/types'

const EMPTY_FORM: ContactInput = {
  name: '',
  phone: '',
  relation: '',
  notifyBySMS: true,
  notifyByCall: true,
  isSafeAdult: true,
}

export default function TrustedContactsScreen() {
  const { theme } = useTheme()
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ContactInput>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const editingContact = useMemo(
    () => contacts.find((contact) => contact.id === editingId) ?? null,
    [contacts, editingId]
  )

  const loadData = async (): Promise<void> => {
    setIsLoading(true)
    const [contactResult, selectedResult] = await Promise.all([
      listContacts(),
      getSetting<string[]>('selected_contact_ids'),
    ])

    if (!contactResult.ok) {
      setError(contactResult.error.message)
      setIsLoading(false)
      return
    }

    setContacts(contactResult.value)
    setSelectedIds(
      selectedResult.ok && Array.isArray(selectedResult.value)
        ? selectedResult.value
        : []
    )
    setIsLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    if (!editingContact) return
    setForm({
      name: editingContact.name,
      phone: editingContact.phone,
      relation: editingContact.relation,
      notifyBySMS: editingContact.notifyBySMS,
      notifyByCall: editingContact.notifyByCall,
      isSafeAdult: editingContact.isSafeAdult,
    })
  }, [editingContact])

  const clearForm = (): void => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const toggleSelected = async (id: string): Promise<void> => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((item) => item !== id)
      : [...selectedIds, id]
    setSelectedIds(next)
    await setSetting('selected_contact_ids', next)
  }

  const saveContact = async (): Promise<void> => {
    setError('')
    if (!form.name.trim() || !form.phone.trim() || !form.relation.trim()) {
      setError('Fill in name, phone, and relation.')
      return
    }

    setIsSaving(true)
    const payload: ContactInput = {
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      relation: form.relation.trim(),
    }

    const result = editingId
      ? await updateContact(editingId, payload)
      : await createContact(payload)

    if (!result.ok) {
      setError(result.error.message)
      setIsSaving(false)
      return
    }

    await loadData()
    clearForm()
    setIsSaving(false)
  }

  const removeContact = async (contact: EmergencyContact): Promise<void> => {
    Alert.alert(
      'Delete contact?',
      `Remove ${contact.name} from trusted contacts on this device?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void confirmDelete(contact.id),
        },
      ]
    )
  }

  const confirmDelete = async (id: string): Promise<void> => {
    setIsSaving(true)
    const result = await deleteContact(id)
    if (!result.ok) {
      setError(result.error.message)
      setIsSaving(false)
      return
    }

    const nextSelected = selectedIds.filter((item) => item !== id)
    setSelectedIds(nextSelected)
    await setSetting('selected_contact_ids', nextSelected)
    await loadData()
    if (editingId === id) clearForm()
    setIsSaving(false)
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
            Trusted contacts
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Local contact list
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Add, edit, delete, and select the people who can receive SOS help.
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Add or edit contact
        </Text>
        <TextInput
          accessibilityLabel='Contact name'
          placeholder='Name'
          placeholderTextColor={theme.textMuted}
          value={form.name}
          onChangeText={(value) =>
            setForm((current) => ({ ...current, name: value }))
          }
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.border },
          ]}
        />
        <TextInput
          accessibilityLabel='Contact phone'
          placeholder='Phone number'
          placeholderTextColor={theme.textMuted}
          value={form.phone}
          onChangeText={(value) =>
            setForm((current) => ({ ...current, phone: value }))
          }
          keyboardType='phone-pad'
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.border },
          ]}
        />
        <TextInput
          accessibilityLabel='Contact relation'
          placeholder='Relation'
          placeholderTextColor={theme.textMuted}
          value={form.relation}
          onChangeText={(value) =>
            setForm((current) => ({ ...current, relation: value }))
          }
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.border },
          ]}
        />
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>
            Notify by SMS
          </Text>
          <Switch
            value={form.notifyBySMS}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, notifyBySMS: value }))
            }
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>
            Notify by call
          </Text>
          <Switch
            value={form.notifyByCall}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, notifyByCall: value }))
            }
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>
            Mark as safe adult
          </Text>
          <Switch
            value={form.isSafeAdult}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, isSafeAdult: value }))
            }
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
        <View style={styles.buttonRow}>
          <TouchableOpacity
            accessibilityRole='button'
            onPress={() => void saveContact()}
            disabled={isSaving}
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.primaryButtonText}>
              {isSaving
                ? 'Saving...'
                : editingId
                  ? 'Update contact'
                  : 'Add contact'}
            </Text>
          </TouchableOpacity>
          {editingId ? (
            <TouchableOpacity
              accessibilityRole='button'
              onPress={clearForm}
              style={[styles.secondaryButton, { borderColor: theme.border }]}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                Cancel edit
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Selected for SOS
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Only selected contacts can receive the prepared message.
        </Text>
        {isLoading ? (
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Loading contacts...
          </Text>
        ) : contacts.length === 0 ? (
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            No contacts yet.
          </Text>
        ) : (
          contacts.map((contact) => {
            const selected = selectedIds.includes(contact.id)
            return (
              <View
                key={contact.id}
                style={[styles.contactRow, { borderColor: theme.border }]}
              >
                <View style={styles.contactCopy}>
                  <Text style={[styles.contactName, { color: theme.text }]}>
                    {contact.name} {contact.isSafeAdult ? '(safe adult)' : ''}
                  </Text>
                  <Text style={[styles.body, { color: theme.textSecondary }]}>
                    {contact.relation} • {contact.phone}
                  </Text>
                  <Text style={[styles.meta, { color: theme.textMuted }]}>
                    SMS {contact.notifyBySMS ? 'on' : 'off'} • Call{' '}
                    {contact.notifyByCall ? 'on' : 'off'}
                  </Text>
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity
                    accessibilityRole='button'
                    accessibilityLabel={
                      selected
                        ? `Remove ${contact.name} from SOS selection`
                        : `Select ${contact.name} for SOS`
                    }
                    onPress={() => void toggleSelected(contact.id)}
                    style={[
                      styles.selectButton,
                      {
                        borderColor: selected ? theme.primary : theme.border,
                        backgroundColor: selected
                          ? theme.primaryLight
                          : theme.background,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.selectButtonText, { color: theme.text }]}
                    >
                      {selected ? 'Selected' : 'Select'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole='button'
                    accessibilityLabel={`Edit ${contact.name}`}
                    onPress={() => setEditingId(contact.id)}
                    style={[styles.iconAction, { borderColor: theme.border }]}
                  >
                    <Ionicons
                      name='create-outline'
                      size={18}
                      color={theme.text}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole='button'
                    accessibilityLabel={`Delete ${contact.name}`}
                    onPress={() => void removeContact(contact)}
                    style={[styles.iconAction, { borderColor: theme.border }]}
                  >
                    <Ionicons
                      name='trash-outline'
                      size={18}
                      color={theme.danger}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )
          })
        )}
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
  card: { gap: 12, borderRadius: 18, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: { fontSize: 15, fontWeight: '700' },
  error: { fontSize: 14, lineHeight: 20 },
  buttonRow: { gap: 10 },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  contactCopy: { flex: 1, gap: 4 },
  contactName: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 12, lineHeight: 16 },
  rowActions: { alignItems: 'center', gap: 8 },
  selectButton: {
    minHeight: 36,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: { fontSize: 13, fontWeight: '700' },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
