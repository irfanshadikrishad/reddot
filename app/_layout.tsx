import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AppLockGate } from '@/components/ui/AppLockGate'
import { AppLockProvider } from '@/contexts/AppLockContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppLockProvider>
            <AppLockGate>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name='index' />
                <Stack.Screen name='(onboarding)' />
                <Stack.Screen name='(app)' />
              </Stack>
              <StatusBar style='auto' />
            </AppLockGate>
          </AppLockProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
