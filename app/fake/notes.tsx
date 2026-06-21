import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

export default function NotesScreen() {
  const [note, setNote] = useState('')

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Notes</Text>
            <Text style={styles.subtitle}>Quick scratchpad</Text>
          </View>
          <TextInput
            multiline
            placeholder='Write a note...'
            placeholderTextColor='#9CA3AF'
            value={note}
            onChangeText={setNote}
            style={styles.input}
          />
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today</Text>
            <Text style={styles.cardBody}>
              {note.trim() || 'No note yet. Tap the page and start typing.'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  fill: { flex: 1 },
  container: { flexGrow: 1, padding: 20, gap: 16 },
  header: { gap: 4, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280' },
  input: {
    minHeight: 180,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
  },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardBody: { fontSize: 14, lineHeight: 20, color: '#374151' },
})
