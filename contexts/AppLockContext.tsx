import {
  getAppLockEnabled,
  getBiometricEnabled,
  getDecoyScreen,
  getPinLockStatus,
  isSessionExpired,
  recordFailedPinAttempt,
  resetPinAttempts,
  updateLastActive,
  verifyAppPin,
  verifyFakePin,
} from '@/services/secureStorage'
import { DecoyScreenType } from '@/types'
import * as LocalAuthentication from 'expo-local-authentication'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { AppState, AppStateStatus } from 'react-native'

// ─── Types ────────────────────────────────────────────────────────────────────

type LockReason = 'startup' | 'background' | 'inactivity' | 'manual'

interface AppLockState {
  isLocked: boolean
  isCheckingLock: boolean
  lockReason: LockReason | null
  pinAttempts: number
  isPinLockedOut: boolean
  pinLockoutRemainingMs: number
  hasBiometric: boolean
  isFakeMode: boolean
  decoyScreen: DecoyScreenType
}

interface AppLockContextValue extends AppLockState {
  unlockWithBiometric: () => Promise<{ success: boolean; error?: string }>
  unlockWithPin: (pin: string) => Promise<{
    success: boolean
    isFake?: boolean
    error?: string
  }>
  lock: (reason?: LockReason) => void
  updateActivity: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppLockContext = createContext<AppLockContextValue | null>(null)

export function useAppLock(): AppLockContextValue {
  const ctx = useContext(AppLockContext)
  if (!ctx) throw new Error('useAppLock must be used within AppLockProvider')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppLockProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppLockState>({
    isLocked: false,
    isCheckingLock: true,
    lockReason: null,
    pinAttempts: 0,
    isPinLockedOut: false,
    pinLockoutRemainingMs: 0,
    hasBiometric: false,
    isFakeMode: false,
    decoyScreen: 'calculator',
  })

  const appStateRef = useRef<AppStateStatus>(AppState.currentState)
  const backgroundTimeRef = useRef<number | null>(null)
  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    initializeLock()
    return () => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current)
    }
  }, [])

  async function initializeLock(): Promise<void> {
    const [
      lockEnabled,
      biometricEnabled,
      biometricHardware,
      lockStatus,
      decoyScreen,
      sessionExpired,
    ] = await Promise.all([
      getAppLockEnabled(),
      getBiometricEnabled(),
      LocalAuthentication.hasHardwareAsync(),
      getPinLockStatus(),
      getDecoyScreen(),
      isSessionExpired(),
    ])

    const hasBiometric =
      biometricEnabled &&
      biometricHardware &&
      (await LocalAuthentication.isEnrolledAsync())

    setState((s) => ({
      ...s,
      isLocked: lockEnabled || sessionExpired,
      lockReason: lockEnabled || sessionExpired ? 'startup' : null,
      isCheckingLock: false,
      hasBiometric,
      isPinLockedOut: lockStatus.isLocked,
      pinLockoutRemainingMs: lockStatus.remainingMs,
      decoyScreen: decoyScreen as DecoyScreenType,
    }))

    if (lockStatus.isLocked) startLockoutCountdown(lockStatus.remainingMs)
  }

  // ─── App state (background → foreground) ─────────────────────────────────

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange)
    return () => sub.remove()
  }, [])

  async function handleAppStateChange(
    nextState: AppStateStatus
  ): Promise<void> {
    const prev = appStateRef.current
    appStateRef.current = nextState

    if (prev === 'active' && nextState === 'background') {
      backgroundTimeRef.current = Date.now()
      await updateLastActive()
    }

    if (
      (prev === 'background' || prev === 'inactive') &&
      nextState === 'active'
    ) {
      const lockEnabled = await getAppLockEnabled()
      if (!lockEnabled) return

      const expired = await isSessionExpired()
      if (expired) {
        setState((s) => ({
          ...s,
          isLocked: true,
          lockReason: 'inactivity',
        }))
      } else if (backgroundTimeRef.current) {
        const elapsed = Date.now() - backgroundTimeRef.current
        // Lock if backgrounded for more than 30 seconds
        if (elapsed > 30_000) {
          setState((s) => ({
            ...s,
            isLocked: true,
            lockReason: 'background',
          }))
        }
      }
    }
  }

  // ─── Lockout countdown ───────────────────────────────────────────────────

  function startLockoutCountdown(initialMs: number): void {
    if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current)

    lockoutTimerRef.current = setInterval(async () => {
      const status = await getPinLockStatus()
      if (!status.isLocked) {
        clearInterval(lockoutTimerRef.current!)
        setState((s) => ({
          ...s,
          isPinLockedOut: false,
          pinLockoutRemainingMs: 0,
        }))
      } else {
        setState((s) => ({
          ...s,
          pinLockoutRemainingMs: status.remainingMs,
        }))
      }
    }, 1000)
  }

  // ─── Unlock methods ──────────────────────────────────────────────────────

  const unlockWithBiometric = useCallback(async (): Promise<{
    success: boolean
    error?: string
  }> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity to open RedDot',
        fallbackLabel: 'Use PIN instead',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      })

      if (result.success) {
        await resetPinAttempts()
        await updateLastActive()
        setState((s) => ({
          ...s,
          isLocked: false,
          lockReason: null,
          pinAttempts: 0,
          isFakeMode: false,
        }))
        return { success: true }
      }

      return {
        success: false,
        error:
          result.error === 'user_cancel'
            ? 'Authentication cancelled.'
            : 'Biometric authentication failed.',
      }
    } catch {
      return { success: false, error: 'Biometric authentication unavailable.' }
    }
  }, [])

  const unlockWithPin = useCallback(
    async (
      pin: string
    ): Promise<{ success: boolean; isFake?: boolean; error?: string }> => {
      // Check lockout first
      const lockStatus = await getPinLockStatus()
      if (lockStatus.isLocked) {
        const mins = Math.ceil(lockStatus.remainingMs / 60000)
        return {
          success: false,
          error: `Too many attempts. Try again in ${mins} minute${mins > 1 ? 's' : ''}.`,
        }
      }

      // Check fake PIN first (priority — activates decoy mode silently)
      const isFakeValid = await verifyFakePin(pin)
      if (isFakeValid) {
        await updateLastActive()
        setState((s) => ({
          ...s,
          isLocked: false,
          lockReason: null,
          isFakeMode: true,
        }))
        return { success: true, isFake: true }
      }

      // Check real PIN
      const isRealValid = await verifyAppPin(pin)
      if (isRealValid) {
        await resetPinAttempts()
        await updateLastActive()
        setState((s) => ({
          ...s,
          isLocked: false,
          lockReason: null,
          pinAttempts: 0,
          isFakeMode: false,
        }))
        return { success: true, isFake: false }
      }

      // Wrong PIN
      const { attempts, lockedUntil } = await recordFailedPinAttempt()
      if (lockedUntil) {
        startLockoutCountdown(lockedUntil - Date.now())
        setState((s) => ({
          ...s,
          pinAttempts: attempts,
          isPinLockedOut: true,
          pinLockoutRemainingMs: lockedUntil - Date.now(),
        }))
        return {
          success: false,
          error: 'Too many attempts. Locked for 15 minutes.',
        }
      }

      const remaining = 3 - attempts
      setState((s) => ({ ...s, pinAttempts: attempts }))
      return {
        success: false,
        error: `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      }
    },
    []
  )

  const lock = useCallback((reason: LockReason = 'manual'): void => {
    setState((s) => ({ ...s, isLocked: true, lockReason: reason }))
  }, [])

  const updateActivity = useCallback((): void => {
    updateLastActive()
  }, [])

  const value: AppLockContextValue = {
    ...state,
    unlockWithBiometric,
    unlockWithPin,
    lock,
    updateActivity,
  }

  return (
    <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>
  )
}
