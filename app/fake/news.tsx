import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const headlines = [
  'City transit expands evening service',
  'New clinic opens in the northern district',
  'Local schools announce holiday schedule',
  'Community market adds weekend hours',
]

export default function NewsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>News</Text>
          <Text style={styles.subtitle}>Top stories</Text>
        </View>
        {headlines.map((headline, index) => (
          <View key={headline} style={styles.card}>
            <Text style={styles.index}>
              {String(index + 1).padStart(2, '0')}
            </Text>
            <Text style={styles.headline}>{headline}</Text>
            <Text style={styles.body}>
              Brief article summary with neutral local coverage and a few lines
              of supporting text.
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 20, gap: 14 },
  header: { paddingTop: 10, gap: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280' },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  index: { fontSize: 12, fontWeight: '800', color: '#2563EB' },
  headline: { fontSize: 17, fontWeight: '700', color: '#111827' },
  body: { fontSize: 14, lineHeight: 20, color: '#4B5563' },
})
