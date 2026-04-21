#### Structure

```bash
reddot/
├── app/ # Expo Router screens
│ ├── (auth)/ # login, register, forgot-password
│ ├── (app)/ # main app (tab layout)
│ │ ├── home/ # SOS button, quick actions
│ │ ├── map/ # nearby safe spaces
│ │ ├── chat/ # anonymous counselor chat
│ │ ├── journal/ # private safety journal
│ │ ├── resources/ # legal, educational
│ │ ├── community/ # tips, resource exchange
│ │ ├── children/ # children's safety zone
│ │ └── settings/ # profile, privacy, stealth mode
│ ├── fake/ # decoy screens (calculator/weather/notes/news)
│ └── \_layout.tsx
├── components/ # shared UI components
├── contexts/ # Auth, Theme, Safety, Settings
├── hooks/ # custom hooks
├── services/ # Firebase, SOS, Recording, Encryption
├── constants/ # BD hotlines, colors, config
└── types/ # TypeScript interfaces
```
