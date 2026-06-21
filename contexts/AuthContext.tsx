import {
  User,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { firebaseAuth, firebaseConfigurationError } from '@/services/firebase'
import { deleteAllLocalData } from '@/services/localDataService'

export type AuthResult =
  | { ok: true; warning?: string }
  | { ok: false; error: string }

interface AuthContextValue {
  user: User | null
  isInitializing: boolean
  isWorking: boolean
  configurationError: string | null
  signIn: (email: string, password: string) => Promise<AuthResult>
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<AuthResult>
  resendVerification: () => Promise<AuthResult>
  refreshUser: () => Promise<AuthResult>
  resetPassword: (email: string) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function authError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : ''
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account already uses this email address.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/network-request-failed':
      'Authentication is unavailable. Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Wait before trying again.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/weak-password': 'Choose a password with at least 6 characters.',
  }
  return messages[code] ?? 'Authentication could not be completed. Try again.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isWorking, setIsWorking] = useState(false)

  useEffect(() => {
    if (!firebaseAuth) {
      setIsInitializing(false)
      return
    }
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser)
      setIsInitializing(false)
    })
  }, [])

  const run = useCallback(
    async (action: () => Promise<void>): Promise<AuthResult> => {
      if (!firebaseAuth) {
        return {
          ok: false,
          error:
            firebaseConfigurationError ??
            'Firebase authentication is unavailable.',
        }
      }
      setIsWorking(true)
      try {
        await action()
        return { ok: true }
      } catch (error) {
        return { ok: false, error: authError(error) }
      } finally {
        setIsWorking(false)
      }
    },
    []
  )

  const signIn = useCallback(
    (email: string, password: string) =>
      run(async () => {
        await signInWithEmailAndPassword(
          firebaseAuth!,
          email.trim().toLowerCase(),
          password
        )
      }),
    [run]
  )

  const register = useCallback(
    (name: string, email: string, password: string) =>
      run(async () => {
        const credential = await createUserWithEmailAndPassword(
          firebaseAuth!,
          email.trim().toLowerCase(),
          password
        )
        await updateProfile(credential.user, { displayName: name.trim() })
        await sendEmailVerification(credential.user)
        setUser(credential.user)
      }),
    [run]
  )

  const resendVerification = useCallback(
    () =>
      run(async () => {
        const currentUser = firebaseAuth!.currentUser
        if (!currentUser) throw new Error('No signed-in user')
        await sendEmailVerification(currentUser)
      }),
    [run]
  )

  const refreshUser = useCallback(
    () =>
      run(async () => {
        const currentUser = firebaseAuth!.currentUser
        if (!currentUser) throw new Error('No signed-in user')
        await reload(currentUser)
        setUser({ ...currentUser })
      }),
    [run]
  )

  const resetPassword = useCallback(
    (email: string) =>
      run(async () => {
        await sendPasswordResetEmail(firebaseAuth!, email.trim().toLowerCase())
      }),
    [run]
  )

  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (!firebaseAuth) {
      return {
        ok: false,
        error:
          firebaseConfigurationError ??
          'Firebase authentication is unavailable.',
      }
    }
    setIsWorking(true)
    try {
      await firebaseSignOut(firebaseAuth)
      setUser(null)

      const deletion = await deleteAllLocalData()
      if (deletion.status !== 'deleted') {
        return {
          ok: true,
          warning:
            'Signed out, but some local data could not be cleared on this device.',
        }
      }

      return { ok: true }
    } catch (error) {
      return { ok: false, error: authError(error) }
    } finally {
      setIsWorking(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      isWorking,
      configurationError: firebaseConfigurationError,
      signIn,
      register,
      resendVerification,
      refreshUser,
      resetPassword,
      signOut,
    }),
    [
      isInitializing,
      isWorking,
      refreshUser,
      register,
      resendVerification,
      resetPassword,
      signIn,
      signOut,
      user,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
