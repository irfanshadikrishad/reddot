# RedDot Project Specification

This document defines RedDot's product purpose, users, standalone architecture,
safety boundaries, data design, and scope. Read it before changing product
behavior or architecture. Use `docs/TODO.md` only for implementation order and
progress.

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

## 7. Current Repository Reality

The app now uses local first-run PIN setup and app-lock routing with no Firebase
or Google Sign-In runtime dependencies. The home screen remains a placeholder,
local repositories are not established, and most safety workflows are still
unimplemented. Phase 1 continues with typed encrypted local persistence before
building the safety dashboard and SOS flow.
