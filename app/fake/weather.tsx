import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const hourly = ['Now 29°', '1 PM 30°', '2 PM 31°', '3 PM 30°', '4 PM 29°']
const forecast = [
  { day: 'Mon', temp: '31° / 24°' },
  { day: 'Tue', temp: '30° / 24°' },
  { day: 'Wed', temp: '29° / 23°' },
]

export default function WeatherScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Weather</Text>
          <Text style={styles.subtitle}>Dhaka, Bangladesh</Text>
        </View>
        <View style={styles.hero}>
          <Text style={styles.temp}>29°</Text>
          <Text style={styles.condition}>Partly cloudy</Text>
          <Text style={styles.detail}>Feels like 33° • Humidity 72%</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Hourly</Text>
          <View style={styles.rowWrap}>
            {hourly.map((item) => (
              <View key={item} style={styles.pill}>
                <Text style={styles.pillText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Forecast</Text>
          {forecast.map((item) => (
            <View key={item.day} style={styles.forecastRow}>
              <Text style={styles.forecastDay}>{item.day}</Text>
              <Text style={styles.forecastTemp}>{item.temp}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EEF6FF' },
  container: { padding: 20, gap: 16 },
  header: { paddingTop: 10, gap: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#334155' },
  hero: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#DBEAFE',
    gap: 6,
  },
  temp: { fontSize: 56, fontWeight: '800', color: '#0F172A' },
  condition: { fontSize: 18, fontWeight: '700', color: '#1E3A8A' },
  detail: { fontSize: 14, color: '#334155' },
  card: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
  },
  pillText: { fontSize: 13, color: '#1E3A8A', fontWeight: '600' },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  forecastDay: { fontSize: 15, color: '#0F172A', fontWeight: '600' },
  forecastTemp: { fontSize: 15, color: '#334155' },
})
