export const APP_CONFIG = {
  name: 'RedDot',
  packageName: 'uk.irfanshadikrishad.reddot',
  version: '1.0.0',
  supportEmail: 'support@irfanshadikrishad.uk',

  // Security
  AUTO_LOGOUT_MINUTES: 5,
  MAX_PIN_ATTEMPTS: 3,
  PIN_LOCKOUT_MINUTES: 15,
  JOURNAL_ENCRYPTION_KEY_LENGTH: 32,

  // SOS
  SOS_COUNTDOWN_SECONDS: 5, // show cancel window before sending

  // Map (Dhaka center default)
  DEFAULT_MAP_REGION: {
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
} as const
