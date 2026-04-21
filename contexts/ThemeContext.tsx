import { DEFAULT_THEME, THEMES, Theme } from '@/constants/theme'
import { ThemeKey } from '@/types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

interface ThemeContextValue {
  theme: Theme
  themeKey: ThemeKey
  setTheme: (key: ThemeKey) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const THEME_STORAGE_KEY = '@reddot_theme'

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>(DEFAULT_THEME)

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored && stored in THEMES) {
        setThemeKey(stored as ThemeKey)
      }
    })
  }, [])

  const setTheme = useCallback((key: ThemeKey) => {
    setThemeKey(key)
    AsyncStorage.setItem(THEME_STORAGE_KEY, key)
  }, [])

  const isDark = themeKey === 'dark' || themeKey === 'midnight'

  const value: ThemeContextValue = {
    theme: THEMES[themeKey],
    themeKey,
    setTheme,
    isDark,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
