# Local Data Model

RedDot keeps protected records on the device. Local data includes trusted contacts, safety plans, journal entries, reminder preferences, and lock settings. Small secrets and counters live in SecureStore. Larger records live in the local SQLite database as encrypted payloads.

The app does not store user safety records in Firebase, AsyncStorage, or a RedDot-owned server. If the user signs out or deletes local data, the app removes the local database, SecureStore secrets, and reminder schedules.

Exact location is only used during the active user action that requested it. It is not retained as a standing profile field.
