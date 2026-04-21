// app/_layout.tsx
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'

// Component that handles auth redirection after initial render
function AuthHandler() {
  const { user, isLoading } = useAuth()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Only redirect once after auth is loaded and we haven't redirected yet
    if (!isLoading && !hasRedirected) {
      setHasRedirected(true)
      if (user) {
        router.replace('/(app)/home')
      } else {
        router.replace('/(auth)/login')
      }
    }
  }, [user, isLoading, hasRedirected])

  // This component doesn't render anything visible
  return null
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Small delay to ensure everything is mounted
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name='index' />
              <Stack.Screen name='(auth)' />
              <Stack.Screen name='(app)' />
            </Stack>
            <StatusBar style='auto' />
            {isReady && <AuthHandler />}
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
