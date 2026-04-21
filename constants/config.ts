export const GOOGLE_WEB_CLIENT_ID =
  "996791254766-9rl40a1le79sba7g5mn2q4fp8tll831d.apps.googleusercontent.com";

export const APP_CONFIG = {
  name: "RedDot",
  packageName: "uk.irfanshadikrishad.reddot",
  version: "1.0.0",
  supportEmail: "support@irfanshadikrishad.uk",

  // Security
  AUTO_LOGOUT_MINUTES: 5,
  MAX_PIN_ATTEMPTS: 3,
  PIN_LOCKOUT_MINUTES: 15,
  JOURNAL_ENCRYPTION_KEY_LENGTH: 32,

  // Chat
  DISAPPEARING_MESSAGE_OPTIONS: [
    { label: "Off", seconds: 0 },
    { label: "30 seconds", seconds: 30 },
    { label: "1 minute", seconds: 60 },
    { label: "5 minutes", seconds: 300 },
    { label: "1 hour", seconds: 3600 },
    { label: "24 hours", seconds: 86400 },
  ],

  // SOS
  SOS_COUNTDOWN_SECONDS: 5, // show cancel window before sending

  // Map (Dhaka center default)
  DEFAULT_MAP_REGION: {
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },

  // Firebase collections
  COLLECTIONS: {
    USERS: "users",
    JOURNAL: "journal",
    SAFE_SPACES: "safeSpaces",
    TIPS: "communityTips",
    RESOURCES: "resourceExchange",
    SAFETY_PLANS: "safetyPlans",
    SAFETY_ALERTS: "safetyAlerts",
    SOS_ALERTS: "sosAlerts",
    REVIEWS: "reviews",
  },

  // Firebase Realtime DB paths
  RTDB_PATHS: {
    CHAT_ROOMS: "chatRooms",
    MESSAGES: "messages",
    COUNSELORS_ONLINE: "counselorsOnline",
    SUPPORT_GROUPS: "supportGroups",
  },
} as const;
