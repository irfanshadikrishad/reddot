import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'

const KEYS = {
  APP_PIN: 'reddot_app_pin',
  FAKE_PIN: 'reddot_fake_pin',
  JOURNAL_KEY: 'reddot_journal_key',
  LOCAL_DATA_KEY: 'reddot_local_data_key',
  BIOMETRIC_ENABLED: 'reddot_biometric_enabled',
  APP_LOCK_ENABLED: 'reddot_app_lock_enabled',
  AUTO_LOGOUT_MINUTES: 'reddot_auto_logout_minutes',
  DECOY_SCREEN: 'reddot_decoy_screen',
  CODE_WORD: 'reddot_code_word',
  LAST_ACTIVE: 'reddot_last_active',
  PIN_ATTEMPTS: 'reddot_pin_attempts',
  PIN_LOCKED_UNTIL: 'reddot_pin_locked_until',
} as const

type SecureKey = (typeof KEYS)[keyof typeof KEYS]

let localDataKeyCreationPromise: Promise<string | null> | null = null

// ─── Core secure store ops ───────────────────────────────────────────────────

async function setItem(key: SecureKey, value: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    })
    return true
  } catch {
    return false
  }
}

async function getItem(key: SecureKey): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key)
  } catch {
    return null
  }
}

async function deleteItem(key: SecureKey): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(key)
    return true
  } catch {
    return false
  }
}

// ─── PIN management ──────────────────────────────────────────────────────────

async function hashPin(pin: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + 'reddot_salt_2024'
  )
}

export async function setAppPin(pin: string): Promise<boolean> {
  const hash = await hashPin(pin)
  return setItem(KEYS.APP_PIN, hash)
}

export async function verifyAppPin(pin: string): Promise<boolean> {
  const stored = await getItem(KEYS.APP_PIN)
  if (!stored) return false
  const hash = await hashPin(pin)
  return stored === hash
}

export async function setFakePin(pin: string): Promise<boolean> {
  const hash = await hashPin(pin)
  return setItem(KEYS.FAKE_PIN, hash)
}

export async function verifyFakePin(pin: string): Promise<boolean> {
  const stored = await getItem(KEYS.FAKE_PIN)
  if (!stored) return false
  const hash = await hashPin(pin)
  return stored === hash
}

export async function hasAppPin(): Promise<boolean> {
  const pin = await getItem(KEYS.APP_PIN)
  return pin !== null
}

export async function completeLocalOnboarding(pin: string): Promise<boolean> {
  const pinSaved = await setAppPin(pin)
  if (!pinSaved) return false

  const lockEnabled = await setAppLockEnabled(true)
  if (!lockEnabled) {
    await deleteItem(KEYS.APP_PIN)
    return false
  }

  const activitySaved = await setItem(KEYS.LAST_ACTIVE, String(Date.now()))
  if (!activitySaved) {
    await Promise.all([
      deleteItem(KEYS.APP_PIN),
      deleteItem(KEYS.APP_LOCK_ENABLED),
    ])
    return false
  }

  return true
}

// ─── PIN lockout ─────────────────────────────────────────────────────────────

export async function recordFailedPinAttempt(): Promise<{
  attempts: number
  lockedUntil: number | null
}> {
  const raw = await getItem(KEYS.PIN_ATTEMPTS)
  const attempts = raw ? parseInt(raw, 10) + 1 : 1
  await setItem(KEYS.PIN_ATTEMPTS, String(attempts))

  const MAX_ATTEMPTS = 3
  const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

  if (attempts >= MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_MS
    await setItem(KEYS.PIN_LOCKED_UNTIL, String(lockedUntil))
    await setItem(KEYS.PIN_ATTEMPTS, '0')
    return { attempts, lockedUntil }
  }

  return { attempts, lockedUntil: null }
}

export async function getPinLockStatus(): Promise<{
  isLocked: boolean
  lockedUntil: number | null
  remainingMs: number
}> {
  const raw = await getItem(KEYS.PIN_LOCKED_UNTIL)
  if (!raw) return { isLocked: false, lockedUntil: null, remainingMs: 0 }

  const lockedUntil = parseInt(raw, 10)
  const remainingMs = lockedUntil - Date.now()

  if (remainingMs <= 0) {
    await deleteItem(KEYS.PIN_LOCKED_UNTIL)
    return { isLocked: false, lockedUntil: null, remainingMs: 0 }
  }

  return { isLocked: true, lockedUntil, remainingMs }
}

export async function resetPinAttempts(): Promise<void> {
  await deleteItem(KEYS.PIN_ATTEMPTS)
  await deleteItem(KEYS.PIN_LOCKED_UNTIL)
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function setBiometricEnabled(enabled: boolean): Promise<boolean> {
  return setItem(KEYS.BIOMETRIC_ENABLED, enabled ? 'true' : 'false')
}

export async function getBiometricEnabled(): Promise<boolean> {
  const val = await getItem(KEYS.BIOMETRIC_ENABLED)
  return val === 'true'
}

export async function setAppLockEnabled(enabled: boolean): Promise<boolean> {
  return setItem(KEYS.APP_LOCK_ENABLED, enabled ? 'true' : 'false')
}

export async function getAppLockEnabled(): Promise<boolean> {
  const val = await getItem(KEYS.APP_LOCK_ENABLED)
  return val === 'true'
}

export async function setAutoLogoutMinutes(minutes: number): Promise<boolean> {
  return setItem(KEYS.AUTO_LOGOUT_MINUTES, String(minutes))
}

export async function getAutoLogoutMinutes(): Promise<number> {
  const val = await getItem(KEYS.AUTO_LOGOUT_MINUTES)
  return val ? parseInt(val, 10) : 5
}

export async function setDecoyScreen(screen: string): Promise<boolean> {
  return setItem(KEYS.DECOY_SCREEN, screen)
}

export async function getDecoyScreen(): Promise<string> {
  const val = await getItem(KEYS.DECOY_SCREEN)
  return val ?? 'calculator'
}

export async function setCodeWord(word: string): Promise<boolean> {
  return setItem(KEYS.CODE_WORD, word)
}

export async function getCodeWord(): Promise<string | null> {
  return getItem(KEYS.CODE_WORD)
}

// ─── Journal encryption key ──────────────────────────────────────────────────

export async function getOrCreateJournalKey(): Promise<string> {
  const existing = await getItem(KEYS.JOURNAL_KEY)
  if (existing) return existing

  // Generate a random 256-bit key
  const randomBytes = await Crypto.getRandomBytesAsync(32)
  const key = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  await setItem(KEYS.JOURNAL_KEY, key)
  return key
}

export async function getJournalKey(): Promise<string | null> {
  return getItem(KEYS.JOURNAL_KEY)
}

export async function getOrCreateLocalDataKey(): Promise<string | null> {
  const storedKey = await readLocalDataKey()
  if (!storedKey.ok) return null
  if (storedKey.value) {
    return /^[a-f0-9]{64}$/.test(storedKey.value) ? storedKey.value : null
  }

  localDataKeyCreationPromise ??= createLocalDataKey().finally(() => {
    localDataKeyCreationPromise = null
  })
  return localDataKeyCreationPromise
}

async function createLocalDataKey(): Promise<string | null> {
  const storedKey = await readLocalDataKey()
  if (!storedKey.ok) return null
  if (storedKey.value) {
    return /^[a-f0-9]{64}$/.test(storedKey.value) ? storedKey.value : null
  }

  const randomBytes = await Crypto.getRandomBytesAsync(32)
  const key = Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  const saved = await setItem(KEYS.LOCAL_DATA_KEY, key)
  return saved ? key : null
}

async function readLocalDataKey(): Promise<
  { ok: true; value: string | null } | { ok: false }
> {
  try {
    return {
      ok: true,
      value: await SecureStore.getItemAsync(KEYS.LOCAL_DATA_KEY),
    }
  } catch {
    return { ok: false }
  }
}

// ─── Activity tracking for auto-logout ───────────────────────────────────────

export async function updateLastActive(): Promise<void> {
  await setItem(KEYS.LAST_ACTIVE, String(Date.now()))
}

export async function getLastActive(): Promise<number> {
  const val = await getItem(KEYS.LAST_ACTIVE)
  return val ? parseInt(val, 10) : Date.now()
}

export async function isSessionExpired(): Promise<boolean> {
  const lastActive = await getLastActive()
  const autoLogoutMinutes = await getAutoLogoutMinutes()
  const elapsedMs = Date.now() - lastActive
  return elapsedMs > autoLogoutMinutes * 60 * 1000
}

// ─── Emergency wipe ──────────────────────────────────────────────────────────

export async function emergencyWipe(): Promise<boolean> {
  const results = await Promise.allSettled(
    Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key))
  )
  return results.every((result) => result.status === 'fulfilled')
}
