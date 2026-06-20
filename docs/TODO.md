# RedDot Standalone App Development Plan

This document is the implementation contract for AI agents working on RedDot.
Read the architecture decision, safety rules, phase scope, and acceptance criteria
before changing code. Do not implement a later phase while a required earlier
phase remains incomplete unless the user explicitly changes the priority.

## 1. Product Purpose

RedDot is a device-first safety companion for women and children in Bangladesh
who may face harassment, domestic violence, stalking, trafficking, abuse,
exploitation, unsafe travel, or another immediate threat.

The app reduces the time, friction, exposure, and uncertainty involved in:

- reaching emergency services or a trusted person;
- finding Bangladesh-specific safety resources;
- preparing a safety plan before a crisis;
- keeping sensitive safety information private on the device;
- helping a child reach an approved safe adult or child-protection service.

RedDot cannot prevent violence, dispatch responders, guarantee message delivery,
or replace police, medical, legal, shelter, counseling, or child-protection
professionals. The interface must never imply otherwise.

## 2. Non-Negotiable Architecture Decision

RedDot is a standalone mobile app. It will not have a custom backend, Firebase,
Supabase, Cloud Functions, an app-operated API, remote database, cloud storage,
realtime chat server, or web administration panel.

All RedDot-owned data and logic must remain on the device. The app may hand an
action to an operating-system or external service only when the user initiates
it. Allowed integrations are:

- the system phone dialer through `tel:` links;
- the system SMS composer through `expo-sms`;
- the system share sheet for user-controlled sharing or export;
- device GPS through `expo-location`;
- local authentication, secure storage, private files, and local notifications;
- a map view when map tiles are available, with an offline list fallback.

Standalone does not mean that phone calls, SMS delivery, GPS, or map tiles work
without their underlying device or network services. It means RedDot does not
operate or depend on its own server. Every external handoff needs a visible
failure state and a local fallback.

### Consequences for the existing repository

Implementation agents must remove, rather than extend, the current
server-oriented architecture:

- replace Firebase authentication with local onboarding and app-lock state;
- remove `AuthContext`, Firebase service usage, Google Sign-In, and authenticated
  profile reads and writes;
- remove unused `@react-native-firebase/*` and Google Sign-In dependencies only
  after all imports are gone;
- replace Firestore and Realtime Database models with local repository APIs;
- remove chat rooms, support groups, community posting, remote reviews, push
  delivery, cloud evidence uploads, remote wipe, and account deletion concepts;
- keep bundled resources read-only in the app and update them through reviewed
  app releases.

Do not add another hosted service to reproduce a removed Firebase feature.

## 3. People And Safeguarding

### Women at risk

The app supports women experiencing or anticipating domestic abuse, harassment,
stalking, coercive control, or unsafe travel. It must be usable under stress and
must not casually expose contacts, plans, location, journal content, or recent
safety activity.

### Children at risk

Child-facing screens use calm, simple, non-graphic language. They offer a short
path to `999`, Bangladesh Child Helpline `1098`, or a locally configured safe
adult. A guardian must never be contacted automatically because a guardian may
be the source of harm. The child must be told what an action will open or share
before it happens.

### Trusted people

Trusted people are stored locally and selected by the user. RedDot may prepare a
call, SMS, or share action for them, but the user remains in control of the
operating-system handoff.

## 4. How The Standalone App Solves Safety Problems

### Problem A: Help is difficult to reach under stress

RedDot provides a high-contrast safety dashboard with SOS, direct hotline calls,
and trusted contacts near the top of the screen. SOS uses a five-second visible
countdown and cancel action before preparing any external action.

Because there is no backend, SOS means a guided device action, not a server
alert. It may:

1. request current location after explicit permission;
2. build a short message containing the user-selected text and optional location;
3. open the system SMS composer with selected trusted contacts;
4. keep direct calls to `999`, `10921`, `1098`, and saved contacts available.

The app may report `message prepared`, `SMS composer opened`, `call action
opened`, or `action unavailable`. It must never report `delivered`, `contact
notified`, or `help is coming`, because the app cannot verify those outcomes.

### Problem B: Phone inspection can increase danger

RedDot uses a local app PIN, optional biometrics, inactivity locking, failed-PIN
lockout, discreet notification text, and a silent fake PIN. A fake PIN opens a
useful decoy without revealing that protected content exists.

PIN hashes, encryption keys, code words, lock configuration, and failed-attempt
state belong in `expo-secure-store`. Larger private records must not be placed in
SecureStore or AsyncStorage. Logs, analytics, and crash text must never contain
PINs, contact numbers, exact locations, journal content, safety plans, or exported
file paths.

These controls reduce accidental exposure. They cannot guarantee safety on a
rooted, compromised, monitored, or shared device.

### Problem C: Bangladesh safety information is fragmented

RedDot bundles reviewed hotline and resource data with the app. Users can browse
it without an account or network connection, filter it by emergency, women and
child abuse, medical, police, legal, shelter, counseling, and childcare needs,
and open a call in the system dialer.

Every bundled resource needs a source, a `lastVerifiedAt` date, and a visible
warning when details may be stale. User ratings, anonymous reviews, and community
posts are out of scope because a standalone app cannot moderate or verify them.

### Problem D: Safety preparation is hard during a crisis

RedDot stores an encrypted local safety plan containing warning signs, safe
people, code words, safe destinations, important documents, exit steps, and
emergency-bag items. Local reminders can prompt a check-in without exposing
sensitive content on the lock screen.

The plan is a user-authored checklist, not professional risk assessment. Export
is always explicit and warns that the exported copy is outside RedDot protection.

### Problem E: Private incident records are difficult to protect

RedDot provides an encrypted local journal and timeline. Journal text is
encrypted before local persistence. Media is not supported until encrypted
private-file handling, deletion, storage limits, and failure recovery are
implemented and tested in Phase 3. Nothing is uploaded automatically.

The app does not claim that a record is anonymous, recoverable after deletion,
or legally admissible.

### Problem F: Children need a safe and understandable path to help

The child safety zone presents simple choices such as `I need help now`, `Call a
safe adult`, and `Call Child Helpline 1098`. It does not require a detailed abuse
report, send data to RedDot, or automatically notify a guardian.

A standalone app cannot provide counselor chat or receive a report. It can only
help the child call or prepare a message to a qualified external service or an
approved safe adult.

### Problem G: Connectivity and permissions fail

Critical hotline data and prepared guidance remain local. If location is denied
or unavailable, the user can continue without it. If SMS is unavailable, the app
shows direct-call choices and the message text for manual use. If map tiles fail,
the bundled list remains usable. No critical action fails silently.

## 5. Local Data Design

### Storage boundaries

- **SecureStore:** app-lock secrets, encryption keys, code word, privacy settings,
  and small security counters only.
- **Local database:** encrypted payloads and non-sensitive indexes for trusted
  contacts, safety plans, journal entries, reminder configuration, and local
  preferences. Use `expo-sqlite` behind typed repository modules.
- **Bundled TypeScript or JSON:** hotlines, reviewed resources, safe-space seed
  data, child-help wording, and safety-plan templates.
- **Private app files:** encrypted journal media only after Phase 3 enables the
  feature. Never use the public gallery by default.
- **Active component state:** exact location and message drafts only for the
  current user action; clear them when the flow ends.

### Required service boundaries

Screens must not access SQLite, SecureStore, the file system, location, SMS, or
the dialer directly. Use focused modules with typed results:

- `services/localDatabase.ts` for schema initialization and migrations;
- `services/contactRepository.ts` for trusted contacts;
- `services/safetyPlanRepository.ts` for encrypted plans;
- `services/journalRepository.ts` for encrypted journal records;
- `services/secureStorage.ts` for secrets and lock configuration;
- `services/hotlineService.ts` for bundled hotlines and dialer handoff;
- `services/sosService.ts` for countdown-independent message preparation and
  external handoffs;
- `services/locationService.ts` for permission and one-time location requests;
- `services/exportService.ts` for explicit encrypted backup and user-directed
  export.

Service results must describe what the app actually knows. For example:

```ts
type ExternalActionResult =
  | { status: 'opened' }
  | { status: 'cancelled' }
  | { status: 'unavailable'; reason: string }
  | { status: 'failed'; reason: string }
```

Do not create a `delivered` status for SMS or calls.

## 6. Features Explicitly Out Of Scope

The following features require server infrastructure, active staff, or moderation
and must not be implemented in this standalone product:

- user accounts, social login, remote profiles, or cross-device sync;
- server-delivered SOS, background remote alerts, or delivery tracking;
- counselor chat, support groups, or child report submission to RedDot;
- community tips, resource exchange, user ratings, reviews, or volunteer matching;
- cloud journal storage, cloud evidence upload, or automatic backup;
- remote wipe, web dashboards, moderator tools, or admin approval queues;
- push notifications from RedDot or remote safety-area alerts;
- remote analytics containing user behavior or safety events.

If a future decision adds a backend, it requires a separate threat model, consent
model, data-retention policy, moderation plan, security rules, incident response
plan, and revised roadmap. It is not an incremental task under this document.

## 7. Implementation Rules For AI Agents

1. Read `AGENTS.md`, this document, the target route, its layout, shared types,
   theme context, and relevant services before editing.
2. Preserve user changes and keep each task within the active phase.
3. Do not introduce Firebase, an HTTP client, hosted databases, backend functions,
   web SDKs, or placeholder network calls.
4. Keep screens thin. Put storage, encryption, location, SMS, calls, and export in
   focused services.
5. Use shared types from `types/index.ts`; remove remote-only types when no code
   depends on them.
6. Request device permission only at the moment a feature needs it. Denial must
   leave a useful fallback.
7. Never log sensitive values. Error messages should identify the failed action,
   not echo private data.
8. Fake PIN behavior must be indistinguishable from ordinary decoy entry. Do not
   show a toast, banner, analytics event, or log that reveals it.
9. Use theme tokens, accessible labels, large touch targets, and layouts that fit
   small screens.
10. After each code task, run Prettier on touched files and `npx tsc --noEmit`.
    Run any phase-specific tests that exist and report real-device checks
    separately from automated checks.
11. Mark a roadmap checkbox complete only when its acceptance criteria work. Do
    not mark placeholders, mock success, or untested critical paths complete.
12. Do not claim an SMS was sent, a call connected, a location was received, or a
    file was deleted unless the platform API provides that exact confirmation.

## 8. Three-Phase Build Plan

## Phase 1: Standalone Foundation And Immediate Help

### Objective

Remove server dependencies and deliver the smallest useful offline-first safety
app: local entry, privacy lock, trusted contacts, Bangladesh hotlines, and a
guided SOS handoff.

### Build order

#### 1. Remove the server architecture

- [ ] Remove Firebase and Google Sign-In initialization, contexts, services, and
      screen dependencies.
- [ ] Replace login, registration, and password reset with a local first-run
      privacy setup. No email or account is required.
- [ ] Route returning users through app-lock state, not remote authentication.
- [ ] Remove unused Firebase and Google Sign-In packages after all imports are
      gone.
- [ ] Remove Firebase collection and realtime path constants.

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

## 9. Definition Of Done For Every Agent Task

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

## 10. Current Repository Reality

The app currently has Firebase-oriented authentication and service code, a
placeholder authenticated home screen, secure-storage/app-lock primitives, and
mostly unimplemented safety workflows. This does not match the standalone
architecture yet. Phase 1 starts by removing remote account assumptions and
building a useful local safety path before adding broader features.
