# RedDot Implementation Roadmap

This file tracks implementation order and progress for the standalone app
defined in `docs/PROJECT.md`. Read `docs/PROJECT.md` and `AGENTS.md` before
working on a checklist item. Do not implement a later phase while a required
earlier phase remains incomplete unless the user explicitly changes priority.

A checked item must satisfy its listed acceptance criteria; placeholders, mocked
success states, and unverified emergency paths do not count as complete.

## Phase 1: Standalone Foundation And Immediate Help

### Objective

Remove server dependencies and deliver the smallest useful offline-first safety
app: local entry, privacy lock, trusted contacts, Bangladesh hotlines, and a
guided SOS handoff.

### Build order

#### 1. Remove the server architecture

- [x] Remove Firebase and Google Sign-In initialization, contexts, services, and
      screen dependencies.
- [x] Replace login, registration, and password reset with a local first-run
      privacy setup. No email or account is required.
- [x] Route returning users through app-lock state, not remote authentication.
- [x] Remove unused Firebase and Google Sign-In packages after all imports are
      gone.
- [x] Remove Firebase collection and realtime path constants.

Acceptance criteria:

- the app launches in airplane mode;
- a new user can enter the app without an account;
- no runtime code imports `@react-native-firebase/*` or Google Sign-In;
- no screen waits for remote authentication.

#### 2. Establish typed local persistence

- [ ] Add `expo-sqlite` and `expo-sms` using Expo SDK-compatible versions.
- [ ] Create a versioned local schema and idempotent migration runner.
- [ ] Add a reviewed application-layer encryption service and repository interfaces for contacts and settings.
- [ ] Keep encryption keys and lock secrets in SecureStore.
- [ ] Add tests for encryption round trips, create, read, update, delete, migration, and corrupt data handling.

Acceptance criteria:

- migrations can run more than once without data loss;
- contact fields and other private records are encrypted before SQLite persistence;
- private records are never written to AsyncStorage;
- repository failures return typed errors and do not crash a screen.

#### 3. Build local onboarding and privacy lock

- [ ] Explain standalone storage, device risk, emergency limitations, and deletion
      during first run.
- [ ] Let the user create an app PIN and optionally enable biometrics.
- [ ] Add fake-PIN setup with a warning not to reuse the real PIN.
- [ ] Implement inactivity and background locking.
- [ ] Add useful calculator, notes, weather, and news decoys that contain no
      RedDot or safety branding.
- [ ] Add privacy settings and local-data deletion.

Acceptance criteria:

- real PIN opens protected content;
- fake PIN silently opens the selected decoy;
- three failed attempts trigger the configured lockout;
- background and inactivity rules work after app restart;
- deletion removes local records, files, and secrets with a visible completion or
  failure result.

#### 4. Build the safety dashboard and hotlines

- [ ] Replace the placeholder home screen with direct SOS, hotline, trusted
      contact, safety-plan, and child-help actions.
- [ ] Render `BD_HOTLINES` by category and availability.
- [ ] Add one-tap dialer handoff with unsupported-device handling.
- [ ] Add source and last-verified metadata to bundled resources.

Acceptance criteria:

- `999`, `10921`, and `1098` are reachable within two intentional actions;
- hotline browsing works in airplane mode;
- the app never claims that opening the dialer connected a call.

#### 5. Build trusted contacts and standalone SOS

- [ ] Add local trusted-contact create, edit, delete, and selection.
- [ ] Add SOS countdown, cancellation, optional one-time location, message preview,
      and system SMS composer handoff.
- [ ] Show call and manual-message fallback when SMS or location is unavailable.
- [ ] Clear exact location and message drafts when the flow closes.

Acceptance criteria:

- SOS can always be cancelled during countdown;
- no external action starts before countdown completion;
- location denial still permits a message without location;
- the final status says only what RedDot knows;
- an accidental second tap cannot create duplicate composers.

### Phase 1 exit gate

- [ ] All Phase 1 acceptance criteria pass on Android; iOS-specific behavior is
      either verified or explicitly documented.
- [ ] Airplane-mode dashboard, hotline, lock, contact, and SOS fallback journeys
      pass.
- [ ] `npx tsc --noEmit`, formatting, and available automated tests pass.
- [ ] No server SDK or remote-data code remains in the runtime bundle.

## Phase 2: Private Planning, Resources, And Child Safety

### Objective

Add private tools that help women and children prepare, record, and find support
without sending RedDot-owned data off the device.

### Build order

#### 1. Encrypted safety plans

- [ ] Implement encrypted safety-plan persistence.
- [ ] Add guided sections for warning signs, safe people, code words, destinations,
      documents, exit steps, and emergency-bag items.
- [ ] Add deliberate encrypted backup export and restore with validation.
- [ ] Warn before plain-text sharing that the exported copy leaves app protection.

Acceptance criteria:

- database inspection does not reveal safety-plan text;
- interrupted writes do not destroy the previous valid plan;
- invalid or wrong-key backups fail without replacing local data.

#### 2. Encrypted text journal

- [ ] Implement create, edit, list, view, and delete for encrypted text entries.
- [ ] Add timeline filters without exposing content in unencrypted indexes.
- [ ] Keep media attachment controls disabled until Phase 3.
- [ ] Add explicit journal export with a privacy warning.

Acceptance criteria:

- database inspection does not reveal journal titles or content;
- journal data never appears in logs or notification previews;
- deleted entries are inaccessible through the app after restart.

#### 3. Bundled resources and safe spaces

- [ ] Create reviewed bundled resource data with category, phone, area, hours,
      source, verification date, and verification status.
- [ ] Add offline list and filters before map presentation.
- [ ] Add optional approximate-distance sorting after location consent.
- [ ] Keep the list usable when permission or map tiles are unavailable.

Acceptance criteria:

- all records show verification status and date;
- no resource claims real-time availability;
- precise user location is not persisted.

#### 4. Child safety zone

- [ ] Build calm entry choices for immediate help, safe-adult contact, `1098`, and
      basic safety guidance.
- [ ] Reuse trusted contacts but require explicit safe-adult designation.
- [ ] Explain every call or SMS handoff before opening it.
- [ ] Do not collect detailed abuse reports or notify a guardian automatically.
- [ ] Add a fast return to a neutral screen.

Acceptance criteria:

- a child can reach `1098` or a safe adult through a short, readable flow;
- no child report is stored or transmitted to RedDot;
- wording is reviewed for age appropriateness and immediate-danger escalation.

#### 5. Local reminders

- [ ] Add opt-in local check-in and safety-plan reminders.
- [ ] Use neutral notification titles and bodies.
- [ ] Let the user preview wording and disable all reminders quickly.

Acceptance criteria:

- notifications reveal no safety context on the lock screen;
- denial of notification permission does not block another feature;
- deleting local data cancels related scheduled notifications.

### Phase 2 exit gate

- [ ] Safety plan, journal, resources, child zone, and reminders work without a
      RedDot server.
- [ ] Sensitive database fields are encrypted and exact location is not retained.
- [ ] Offline, permission-denied, corrupt-data, and wrong-backup-key cases pass.
- [ ] TypeScript, formatting, repository tests, and critical UI tests pass.

## Phase 3: Device Hardening And Release Readiness

### Objective

Harden local security, optional media, recovery, accessibility, and real-device
reliability for a closed beta without introducing server dependencies.

### Build order

#### 1. Threat model and privacy verification

- [ ] Document assets, attackers, device-compromise limits, external handoffs, and
      residual risks.
- [ ] Audit logs, screenshots, app switcher previews, clipboard use, notification
      previews, exported files, backups, and temporary files.
- [ ] Add screen-capture protection where supported and document platform gaps.
- [ ] Verify encryption key loss, PIN reset, failed deletion, and low-storage
      behavior.

Acceptance criteria:

- the threat model matches the shipped implementation;
- no sensitive test value appears in logs, previews, or temporary files;
- unrecoverable local-data scenarios are explained before they can occur.

#### 2. Encrypted private media

- [ ] Add photo, audio, or document attachments only after choosing and reviewing
      an authenticated-encryption design suitable for binary files.
- [ ] Store encrypted files in app-private storage with randomized names.
- [ ] Add explicit capture/import consent, storage limits, cleanup, and failure
      recovery.
- [ ] Decrypt only for an active view or explicit export and remove temporary
      plaintext immediately.

Acceptance criteria:

- private app files do not reveal media content or original filenames;
- interrupted import and deletion leave no untracked plaintext;
- low storage and permission denial fail safely.

#### 3. Backup, export, and deletion hardening

- [ ] Provide a versioned encrypted backup file that the user saves manually.
- [ ] Validate imports before changing current data and support rollback.
- [ ] Separate encrypted backup from plain sharing and explain the difference.
- [ ] Make full local wipe cancel notifications, close sessions, delete database
      rows and private files, and remove SecureStore secrets.

Acceptance criteria:

- backup round-trip succeeds across supported app versions;
- corrupted imports cannot partially overwrite current data;
- wipe reports partial failure and never claims completion falsely.

#### 4. Accessibility and stress usability

- [ ] Test small screens, large text, screen readers, reduced motion, contrast,
      keyboard behavior, and one-handed use.
- [ ] Keep emergency actions visible without scrolling where practical.
- [ ] Add accessible names, roles, states, and hints to all critical controls.
- [ ] Test Bengali-ready layouts even if the first release remains English.

Acceptance criteria:

- critical journeys remain understandable at large text sizes;
- screen readers announce action, state, and consequence;
- countdown and error states do not depend on color alone.

#### 5. Release validation

- [ ] Add unit tests for encryption wrappers, repositories, migrations, SOS message
      construction, and resource validation.
- [ ] Add E2E smoke tests for first run, real PIN, fake PIN, hotline, SOS cancel,
      SMS handoff, journal, child help, backup restore, and wipe.
- [ ] Test fresh install, upgrade, airplane mode, denied permissions, missing SIM,
      no dialer, low storage, process death, and app restart.
- [ ] Add CI for formatting, TypeScript, tests, and dependency checks.
- [ ] Write privacy policy, crisis disclaimer, local-data explanation, and release
      risk checklist.

Acceptance criteria:

- all automated checks pass;
- the closed-beta device matrix passes or has documented limitations;
- bundled hotline and resource data has an owner and review date;
- no runtime dependency requires a RedDot backend.

### Phase 3 exit gate

- [ ] Core emergency, privacy, child-help, planning, journal, export, and wipe
      journeys pass on real supported devices.
- [ ] Security and privacy review findings are resolved or explicitly accepted.
- [ ] Release documentation states limitations without promising rescue, delivery,
      anonymity, or professional outcomes.
- [ ] The app is ready for a limited closed beta as a standalone product.

## Definition Of Done For Every Agent Task

A task is complete only when:

- behavior matches this standalone architecture and the active phase;
- loading, empty, error, offline, denied-permission, and cancellation states that
  apply to the feature are handled;
- sensitive data is neither logged nor stored in plaintext outside active memory;
- accessibility labels and small-screen layouts are covered;
- touched code is formatted and `npx tsc --noEmit` passes;
- relevant automated tests pass;
- required real-device verification is reported honestly;
- documentation and phase checkboxes reflect implemented behavior, not intent.
