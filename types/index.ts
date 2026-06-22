// ─── User & Auth ────────────────────────────────────────────────────────────
export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  isAnonymous: boolean
  createdAt: number
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  phone?: string
  emergencyContacts: EmergencyContact[]
  codeWord?: string
  fakePin?: string
  decoyScreen: DecoyScreenType
  stealthModeEnabled: boolean
  appLockEnabled: boolean
  biometricEnabled: boolean
  autoLogoutMinutes: number
  childModeEnabled: boolean
  createdAt: number
  updatedAt: number
}

// ─── Emergency ──────────────────────────────────────────────────────────────
export interface EmergencyContact {
  id: string
  name: string
  phone: string
  relation: string
  notifyBySMS: boolean
  notifyByCall: boolean
  isSafeAdult: boolean
}

export interface SOSAlert {
  id: string
  uid: string
  location: GeoLocation
  timestamp: number
  status: 'active' | 'resolved'
  contactsNotified: string[]
}

// ─── Location & Map ─────────────────────────────────────────────────────────
export interface GeoLocation {
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
}

export type SafeSpaceType =
  | 'shelter'
  | 'hospital'
  | 'police'
  | 'legal'
  | 'counseling'
  | 'childcare'

export interface SafeSpace {
  id: string
  name: string
  type: SafeSpaceType
  location: GeoLocation
  phone?: string
  hours?: string
  isOpen?: boolean
  rating?: number
  reviewCount?: number
  verified: boolean
}

export interface BundledSafeSpace extends SafeSpace, BundledResourceMetadata {
  area: string
}

// ─── Journal ─────────────────────────────────────────────────────────────────
export interface JournalEntry {
  id: string
  uid: string
  title: string
  content: string // encrypted
  mediaUrls: JournalMedia[]
  mood?: MoodType
  tags: string[]
  createdAt: number
  updatedAt: number
  isEncrypted: boolean
}

export interface JournalMedia {
  id: string
  type: 'photo' | 'video' | 'audio'
  url: string
  thumbnail?: string
  createdAt: number
}

export type MoodType = 'safe' | 'anxious' | 'scared' | 'hopeful' | 'neutral'

export type JournalTimelineFilter = 'all' | '7d' | '30d' | '90d'

export interface JournalEntryInput {
  uid: string
  title: string
  content: string
  mood?: MoodType
  tags: string[]
}

export type ReminderKind = 'check_in' | 'safety_plan'

export interface ReminderPreferences {
  checkInEnabled: boolean
  checkInHour: number
  checkInMinute: number
  checkInNotificationId: string | null
  safetyPlanEnabled: boolean
  safetyPlanHour: number
  safetyPlanMinute: number
  safetyPlanNotificationId: string | null
}

// ─── Chat ────────────────────────────────────────────────────────────────────
export interface ChatRoom {
  id: string
  type: 'counselor' | 'support_group'
  participants: string[]
  lastMessage?: string
  lastMessageAt?: number
  createdAt: number
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string // anonymous hash
  content: string
  type: 'text' | 'file' | 'image'
  fileUrl?: string
  disappearsAt?: number // optional self-destruct timestamp
  createdAt: number
  isRead: boolean
}

// ─── Community ───────────────────────────────────────────────────────────────
export interface AnonymousTip {
  id: string
  location?: GeoLocation
  description: string
  category: 'harassment' | 'suspicious' | 'domestic' | 'child_safety' | 'other'
  timestamp: number
  upvotes: number
  status: 'pending' | 'reviewed' | 'actioned'
}

export interface ResourceExchange {
  id: string
  type: 'clothes' | 'toys' | 'supplies' | 'food' | 'other'
  description: string
  location?: string // general area only, no exact address
  contactMethod: 'in_app' | 'phone'
  available: boolean
  createdAt: number
}

// ─── Safety Plan ─────────────────────────────────────────────────────────────
export interface SafetyPlan {
  id: string
  uid: string
  triggerSigns: string[]
  safePersons: string[]
  safeLocations: string[]
  importantDocuments: string[]
  exitSteps: string[]
  escapeBagItems: string[]
  codeWord?: string
  localResources: string[]
  updatedAt: number
}

export interface SafetyPlanInput {
  uid: string
  triggerSigns: string[]
  safePersons: string[]
  safeLocations: string[]
  importantDocuments: string[]
  exitSteps: string[]
  escapeBagItems: string[]
  codeWord: string
  localResources: string[]
}

// ─── Settings ────────────────────────────────────────────────────────────────
export type DecoyScreenType = 'calculator' | 'weather' | 'notes' | 'news'

export type ThemeKey =
  | 'light'
  | 'dark'
  | 'rose'
  | 'purple'
  | 'ocean'
  | 'midnight'

// ─── Notifications ───────────────────────────────────────────────────────────
export interface SafetyAlert {
  id: string
  title: string
  body: string
  type: 'safety_tip' | 'area_alert' | 'appointment' | 'check_in'
  area?: string
  createdAt: number
  expiresAt?: number
}

// ─── Hotlines ────────────────────────────────────────────────────────────────
export interface BundledResourceMetadata {
  sourceName: string
  sourceUrl: string
  verificationStatus: 'reviewed' | 'needs_review'
  lastVerifiedAt: string
}

export interface Hotline extends BundledResourceMetadata {
  id: string
  name: string
  number: string
  description: string
  category:
    | 'domestic_violence'
    | 'child_protection'
    | 'medical'
    | 'police'
    | 'mental_health'
  available24h: boolean
}

// ─── Local repositories ─────────────────────────────────────────────────────
export type RepositoryErrorCode =
  | 'database_unavailable'
  | 'encryption_unavailable'
  | 'invalid_data'
  | 'not_found'
  | 'write_failed'

export interface RepositoryError {
  code: RepositoryErrorCode
  message: string
}

export type RepositoryResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: RepositoryError }

export interface ContactInput {
  name: string
  phone: string
  relation: string
  notifyBySMS: boolean
  notifyByCall: boolean
  isSafeAdult: boolean
}

export type LocalSettingKey =
  | 'default_sos_message'
  | 'include_location_in_sos'
  | 'selected_contact_ids'
  | 'reminder_preferences'

export interface SosDraftSettings {
  defaultMessage: string
  includeLocation: boolean
  selectedContactIds: string[]
}
