import { useMemo, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const KEYS = [
  'C',
  '±',
  '%',
  '÷',
  '7',
  '8',
  '9',
  '×',
  '4',
  '5',
  '6',
  '−',
  '1',
  '2',
  '3',
  '+',
  '0',
  '.',
  '=',
]

function evaluateExpression(expression: string): string {
  if (!expression) return '0'
  const sanitized = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
  try {
    const result = Function(`'use strict'; return (${sanitized})`)()
    if (!Number.isFinite(result)) return 'Error'
    const text = String(result)
    return text.length > 12 ? Number(result).toPrecision(8) : text
  } catch {
    return 'Error'
  }
}

export default function CalculatorScreen() {
  const [expression, setExpression] = useState('')
  const [display, setDisplay] = useState('0')

  const preview = useMemo(() => evaluateExpression(expression), [expression])

  const pressKey = (key: string) => {
    if (key === 'C') {
      setExpression('')
      setDisplay('0')
      return
    }
    if (key === '=') {
      const result = evaluateExpression(expression)
      setDisplay(result)
      setExpression(result === 'Error' ? '' : result)
      return
    }
    if (key === '±') {
      if (!expression) return
      setExpression((current) =>
        current.startsWith('-') ? current.slice(1) : `-${current}`
      )
      return
    }
    if (key === '%') {
      if (!expression) return
      setExpression((current) => `${current}/100`)
      return
    }
    const next = `${expression}${key}`
    setExpression(next)
    setDisplay(next)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Calculator</Text>
          <Text style={styles.subtitle}>Standard mode</Text>
        </View>
        <View style={styles.display}>
          <Text style={styles.expression}>{expression || ' '}</Text>
          <Text style={styles.result}>{display}</Text>
          <Text style={styles.preview}>{preview}</Text>
        </View>
        <View style={styles.grid}>
          {KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              onPress={() => pressKey(key)}
              style={[
                styles.key,
                key === '=' && styles.equalsKey,
                ['÷', '×', '−', '+'].includes(key) && styles.operatorKey,
                ['C', '±', '%'].includes(key) && styles.utilityKey,
                key === '0' && styles.zeroKey,
              ]}
            >
              <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, padding: 20, gap: 18 },
  header: { paddingTop: 10, gap: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280' },
  display: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    padding: 18,
    justifyContent: 'flex-end',
    gap: 8,
  },
  expression: { fontSize: 18, color: '#6B7280', textAlign: 'right' },
  result: {
    fontSize: 44,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
  },
  preview: { fontSize: 14, color: '#9CA3AF', textAlign: 'right' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  key: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zeroKey: { width: '46%' },
  equalsKey: { backgroundColor: '#2563EB' },
  operatorKey: { backgroundColor: '#DBEAFE' },
  utilityKey: { backgroundColor: '#E5E7EB' },
  keyText: { fontSize: 22, fontWeight: '700', color: '#111827' },
})
