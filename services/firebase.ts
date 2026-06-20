// services/firebase.ts
import { getAuth } from '@react-native-firebase/auth'
import {
  serverTimestamp as databaseServerTimestamp,
  getDatabase,
} from '@react-native-firebase/database'
import {
  serverTimestamp as firestoreServerTimestamp,
  getFirestore,
  increment,
} from '@react-native-firebase/firestore'
import { getMessaging } from '@react-native-firebase/messaging'
import { getStorage } from '@react-native-firebase/storage'

// Get instances
export const firebaseAuth = getAuth()
export const firestoreDB = getFirestore()
export const realtimeDB = getDatabase()
export const firebaseStorage = getStorage()
export const firebaseMessaging = getMessaging()

// Firestore helpers - call as functions
export const serverTimestamp = firestoreServerTimestamp
export const firestoreIncrement = increment

// Realtime DB helpers - call as function
export const getServerTimestamp = databaseServerTimestamp

export default {
  auth: firebaseAuth,
  firestore: firestoreDB,
  database: realtimeDB,
  storage: firebaseStorage,
  messaging: firebaseMessaging,
  serverTimestamp,
  firestoreIncrement,
  getServerTimestamp,
}
