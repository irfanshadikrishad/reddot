import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useTheme } from '@/contexts/ThemeContext'

const SECTIONS = [
  'Warning signs',
  'Safe people',
  'Safe places',
  'Important documents',
  'Exit steps',
  'Emergency bag',
]

export default function SafetyPlanScreen() {
  const { theme } = useTheme()

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
            What to prepare
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            The encrypted local plan comes in the next phase. This screen lists
            the sections RedDot will store on the device.
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Plan sections
        </Text>
        {SECTIONS.map((section) => (
          <View
            key={section}
            style={[styles.row, { borderColor: theme.border }]}
          >
            <Text style={[styles.rowText, { color: theme.text }]}>
              {section}
            </Text>
          </View>
        ))}
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Keep the wording concrete and short. The plan should help you move,
          leave, and reach support without exposing extra detail.
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
  card: { gap: 12, borderRadius: 18, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  row: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowText: { fontSize: 15, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
})
