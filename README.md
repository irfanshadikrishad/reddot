# RedDot

RedDot is a device-first safety companion for women and children in
Bangladesh. It is designed to make emergency contacts, trusted people, safety
planning, private records, and child-safe help easier to reach without operating
a RedDot backend or sending RedDot-owned data to a server.

> **Development status:** RedDot is not ready for safety-critical use. The
> Firebase email authentication and verification gate protected routes. The
> current home screen is still a placeholder and most safety
> workflows are not implemented.

## What Problem RedDot Addresses

Women and children facing harassment, domestic violence, stalking, abuse,
trafficking, exploitation, or unsafe travel may need to act quickly while also
keeping their safety activity private from someone who can inspect or control
their phone. Emergency numbers, contacts, notes, plans, and local resources are
often fragmented across multiple apps and websites.

RedDot is intended to reduce that friction through:

- **Immediate help:** prominent SOS guidance, trusted contacts, and direct access
  to Bangladesh emergency and support hotlines.
- **Privacy under pressure:** app PIN, optional biometrics, inactivity locking, a
  silent fake PIN, useful decoy screens, discreet wording, and encrypted local
  records.
- **Preparation:** private safety plans, code words, safe destinations, important
  document checklists, emergency-bag lists, and neutral local reminders.
- **Private records:** an encrypted on-device journal and, after security
  hardening, encrypted private media.
- **Child-safe help:** calm, short paths to `999`, Bangladesh Child Helpline
  `1098`, or a locally approved safe adult without automatic guardian
  notification.
- **Local resources:** bundled Bangladesh hotlines, safe spaces, and reviewed
  support information that remains useful without a RedDot server.

## Standalone Architecture

RedDot will not have a custom backend, remote database, cloud storage, web admin
panel, remote chat system, or RedDot-managed user accounts. App-owned data and
logic remain on the device.

The app may open user-initiated operating-system services:

- phone dialer through `tel:` links;
- SMS composer through `expo-sms`;
- share sheet for deliberate export;
- GPS through `expo-location`;
- local notifications, biometrics, SecureStore, SQLite, and private app files;
- map tiles when available, with an offline resource-list fallback.

Standalone does not mean every external action works offline. Calls and SMS
still depend on the device and carrier, GPS may be unavailable, and map tiles may
need connectivity. RedDot must show those failures and preserve direct-call or
manual alternatives.

### SOS semantics

Without a backend, SOS is a guided device action rather than a server-delivered
alert:

1. Show a five-second countdown with a clear cancel action.
2. Request one-time location only after explicit permission.
3. Preview a short message with optional location.
4. Open the system SMS composer for selected trusted contacts.
5. Keep direct hotline and contact calls available as fallback.

RedDot may say that a message was prepared or a composer was opened. It must not
claim that an SMS was delivered, a contact was notified, a call connected, or
help is coming.

## Local Data And Privacy

The target storage boundaries are:

- `expo-secure-store` for PIN hashes, encryption keys, code words, lock settings,
  and small security counters;
- `expo-sqlite` repositories for encrypted contacts, safety plans, journal
  entries, reminders, and local preferences;
- bundled TypeScript or JSON for reviewed hotlines and resources;
- app-private encrypted files for Phase 3 journal media;
- active memory only for exact location and message drafts during the current
  action.

Sensitive values must never be written to logs, analytics, AsyncStorage, public
files, or notification previews. Fake-PIN entry must open a decoy silently and
must not produce revealing text or events.

These controls reduce exposure but cannot make a rooted, compromised, monitored,
or shared device safe.

## Features Not Included

The standalone product intentionally excludes features that require an operated
server, staff, or moderation:

- accounts, social login, remote profiles, and cross-device sync;
- server-delivered SOS and delivery tracking;
- counselor chat, support groups, and report submission to RedDot;
- community posts, reviews, ratings, and volunteer matching;
- cloud evidence uploads and automatic cloud backup;
- remote wipe, web dashboards, and push alerts from RedDot.

## Three-Phase Roadmap

The product and architecture specification is in
[docs/PROJECT.md](docs/PROJECT.md). Detailed implementation order, acceptance
criteria, safety gates, and definition of done are in
[docs/TODO.md](docs/TODO.md).

### Phase 1: Account Foundation And Immediate Help

Use Firebase email authentication and verification while keeping safety records
in typed encrypted local persistence. Add optional app lock and decoys, the
safety dashboard, bundled hotlines, trusted contacts, and device-based SOS with
cancellation and fallbacks.

### Phase 2: Private Planning, Resources, And Child Safety

Add encrypted safety plans and text journal, reviewed bundled resources and safe
spaces, child-safe help flows, and discreet local reminders.

### Phase 3: Device Hardening And Release Readiness

Complete the threat model, encrypted media, backup and deletion hardening,
accessibility, stress usability, automated tests, real-device failure testing,
and closed-beta documentation.

## Current Repository State

The codebase currently contains:

- Expo Router authentication and protected route groups;
- Firebase email registration, verification, login, reset, and protected routing;
- theme, authentication, and app-lock contexts;
- SecureStore-based PIN, fake PIN, lockout, and local security helpers;
- Bangladesh hotline constants and shared domain types;
- a placeholder protected home screen.

Do not treat an unchecked roadmap item as implemented. Continue Phase 1 in the
documented order; the safety dashboard is not implemented yet.

## Project Structure

```text
app/
  _layout.tsx          Root providers and routing
  (auth)/              Firebase login, registration, verification, and reset
  (app)/               Protected local app routes
components/            Shared UI components
constants/             Configuration, theme tokens, and Bangladesh hotlines
contexts/              Theme, Firebase authentication, and app-lock state
docs/PROJECT.md        Product, architecture, safety, and scope specification
docs/TODO.md           Three-phase implementation tracker and acceptance gates
services/               Firebase Auth, security, device, and local repositories
types/                  Shared TypeScript domain types
assets/                 App icons and images
```

## Development

### Prerequisites

- Node.js and npm
- Android Studio and an Android device or emulator for Android native builds
- Xcode and CocoaPods on macOS for iOS native builds

This project uses native modules, so validate safety-critical behavior in native
development builds and on real devices. Copy `.env.example` to `.env`, add the
Firebase web-app configuration, and enable Email/Password authentication in the
Firebase console. No Firestore, Storage, Realtime Database, or Messaging setup is
used.

### Install and run

```bash
npm install
npm run android
```

Other available commands:

```bash
npm run start
npm run ios
npm run web
npm run format
npx tsc --noEmit
```

There is currently no automated test script. Do not report tests as passing
unless a test runner has been added and executed.

## Working On RedDot

Read [AGENTS.md](AGENTS.md), [docs/PROJECT.md](docs/PROJECT.md), and
[docs/TODO.md](docs/TODO.md) before making changes. PROJECT defines the product
and architecture; TODO defines implementation order and progress. In particular:

- do not add a backend or substitute another hosted service for Firebase;
- keep screens thin and device or storage operations in typed services;
- use `BD_HOTLINES` rather than duplicating numbers;
- handle cancellation, offline, unavailable, and denied-permission states;
- never log or expose sensitive user data;
- format touched files and run `npx tsc --noEmit`;
- mark roadmap items complete only after their acceptance criteria pass.

## Safety Limitations

RedDot does not replace police, ambulance, fire, child-protection, shelter,
medical, legal, or counseling professionals. It does not guarantee rescue, alert
delivery, anonymity, evidence acceptance, service availability, or safety on a
compromised device. Bundled contact information may become stale and must be
reviewed before release.
