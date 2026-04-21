// services/firebase.ts
import { getApps, initializeApp } from '@react-native-firebase/app'
import auth from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import firestore from '@react-native-firebase/firestore'
import messaging from '@react-native-firebase/messaging'
import storage from '@react-native-firebase/storage'

// Initialize Firebase only if not already initialized
if (!getApps().length) {
  initializeApp()
}

// Get instances
export const firebaseAuth = auth()
export const firestoreDB = firestore()
export const realtimeDB = database()
export const firebaseStorage = storage()
export const firebaseMessaging = messaging()

// Firestore helpers - call as functions
export const serverTimestamp = () => firestore.FieldValue.serverTimestamp()
export const firestoreIncrement = (n: number) =>
  firestore.FieldValue.increment(n)

// Realtime DB helpers - call as function
export const getServerTimestamp = () => database.ServerValue.TIMESTAMP

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
