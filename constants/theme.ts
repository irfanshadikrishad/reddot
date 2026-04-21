import { ThemeKey } from '@/types'

export interface Theme {
  background: string
  surface: string
  surfaceSecondary: string
  primary: string
  primaryLight: string
  danger: string
  success: string
  warning: string
  text: string
  textSecondary: string
  textMuted: string
  border: string
  shadow: string
  overlay: string
  card: string
}

export const THEMES: Record<ThemeKey, Theme> = {
  light: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F5F5',
    primary: '#C0392B',
    primaryLight: '#FADBD8',
    danger: '#E74C3C',
    success: '#27AE60',
    warning: '#F39C12',
    text: '#1A1A1A',
    textSecondary: '#555555',
    textMuted: '#999999',
    border: '#E8E8E8',
    shadow: 'rgba(0,0,0,0.08)',
    overlay: 'rgba(0,0,0,0.5)',
    card: '#FFFFFF',
  },
  dark: {
    background: '#0D0D0D',
    surface: '#1A1A1A',
    surfaceSecondary: '#242424',
    primary: '#E74C3C',
    primaryLight: '#4A1010',
    danger: '#FF4444',
    success: '#2ECC71',
    warning: '#F1C40F',
    text: '#F0F0F0',
    textSecondary: '#BBBBBB',
    textMuted: '#666666',
    border: '#2E2E2E',
    shadow: 'rgba(0,0,0,0.4)',
    overlay: 'rgba(0,0,0,0.7)',
    card: '#1E1E1E',
  },
  rose: {
    background: '#FFF5F5',
    surface: '#FFFFFF',
    surfaceSecondary: '#FFF0F0',
    primary: '#E91E63',
    primaryLight: '#FCE4EC',
    danger: '#F44336',
    success: '#4CAF50',
    warning: '#FF9800',
    text: '#1A1A1A',
    textSecondary: '#555555',
    textMuted: '#999999',
    border: '#F8BBD0',
    shadow: 'rgba(233,30,99,0.1)',
    overlay: 'rgba(0,0,0,0.5)',
    card: '#FFFFFF',
  },
  purple: {
    background: '#F8F5FF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F3EEFF',
    primary: '#7B2D8B',
    primaryLight: '#E8D5F0',
    danger: '#E53935',
    success: '#43A047',
    warning: '#FB8C00',
    text: '#1A1A1A',
    textSecondary: '#555555',
    textMuted: '#999999',
    border: '#D1B3E0',
    shadow: 'rgba(123,45,139,0.1)',
    overlay: 'rgba(0,0,0,0.5)',
    card: '#FFFFFF',
  },
  ocean: {
    background: '#F0F7FF',
    surface: '#FFFFFF',
    surfaceSecondary: '#E8F4FD',
    primary: '#0277BD',
    primaryLight: '#B3D9F5',
    danger: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
    text: '#1A1A1A',
    textSecondary: '#555555',
    textMuted: '#999999',
    border: '#B3D9F5',
    shadow: 'rgba(2,119,189,0.1)',
    overlay: 'rgba(0,0,0,0.5)',
    card: '#FFFFFF',
  },
  midnight: {
    background: '#070B14',
    surface: '#0F1623',
    surfaceSecondary: '#151E30',
    primary: '#C0392B',
    primaryLight: '#3D1010',
    danger: '#FF5252',
    success: '#00E676',
    warning: '#FFD740',
    text: '#E8EAF0',
    textSecondary: '#A0AAC0',
    textMuted: '#505870',
    border: '#1E2A42',
    shadow: 'rgba(0,0,0,0.6)',
    overlay: 'rgba(0,0,0,0.8)',
    card: '#111827',
  },
}

export const DEFAULT_THEME: ThemeKey = 'light'
