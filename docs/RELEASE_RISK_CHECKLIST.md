# Release Risk Checklist

- confirm the threat model matches the shipped build;
- confirm screenshots, notifications, app switcher previews, clipboard use, temporary files, and exported files do not leak sensitive content;
- confirm the privacy policy and crisis disclaimer are reviewed;
- confirm local wipe removes the database, SecureStore secrets, and scheduled reminders;
- confirm no runtime path depends on a RedDot backend;
- confirm supported-device behavior is documented when a platform cannot provide the same protection.
