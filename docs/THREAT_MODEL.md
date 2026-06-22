# RedDot Threat Model

## Assets

- app PINs, fake PINs, biometric preference, lock timers, and code words;
- trusted contacts and safe-adult designations;
- safety plans, journal entries, reminder preferences, and local settings;
- encrypted backup files and exported text that the user chooses to share;
- exact location collected during an active SOS or explicit location request.

## Likely attackers

- a person with temporary physical access to the phone;
- a person checking notifications, app switcher previews, clipboard history, or share sheets;
- a person with file-system access to exported files or temporary plaintext;
- malware or a compromised OS with broader device access;
- a network observer, only for actions that leave the device through user-initiated services.

## Device-compromise limits

RedDot cannot defend against a rooted or fully compromised device, a hostile OS, or a person who can watch the screen directly. Screen-capture prevention reduces casual screenshots and recordings on supported platforms, but it does not defeat an external camera or all OEM behaviors.

## External handoffs

The app only hands control to services the user starts, such as the dialer, SMS composer, share sheet, file picker, local notifications, and local authentication. The app never claims that a call connected or that a message was delivered.

## Privacy audit notes

- logging must never contain PINs, contacts, journal text, exact location, or export paths;
- notification previews must remain neutral and not reveal safety intent;
- clipboard use should be limited to explicit user actions;
- temporary plaintext should be removed immediately after an import, export, or preview flow ends;
- exported files remain the user's responsibility once they leave app protection.

## Residual risks

- app switcher protection and screenshot blocking vary by platform and OEM;
- a device owner can still reveal information by opening exports or taking photos of the screen;
- local encrypted data cannot be recovered if the device keys or app secrets are lost.
