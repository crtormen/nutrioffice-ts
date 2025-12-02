# NutriOffice-TS

A comprehensive nutrition practice management system built with React, TypeScript, and Firebase.

## 🚀 Features

- **Customer Management** - Complete patient records and profiles
- **Consultations** - Schedule and manage nutrition consultations
- **Anamnesis** - Detailed health and nutrition history forms
- **Body Composition** - Track measurements and progress
- **Financial Management** - Payments and billing
- **Team Collaboration** - Invite and manage team members with role-based permissions
- **Analytics** - Reports and insights dashboard
- **Customizable Theme** - Personalize colors, fonts, and branding

## 🏗️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **State Management:** Redux Toolkit + RTK Query
- **Backend:** Firebase (Auth, Firestore, Functions, Storage)
- **UI Components:** shadcn/ui + Radix UI + Tailwind CSS
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Icons:** Lucide React

## 📋 Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Firebase account
- Gmail account (for email features)

## ⚡ Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd nutrioffice-ts

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase config

# Start Firebase emulators (in one terminal)
npm run emulate

# Start dev server (in another terminal)
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) folder:

- **[Getting Started](docs/QUICK_START.md)** - 5-minute setup guide
- **[Architecture](CLAUDE.md)** - Project structure and patterns
- **[Invitation System](docs/INVITATION_SYSTEM.md)** - Team collaboration features
- **[Permissions Guide](docs/PERMISSIONS_GUIDE.md)** - Role-based access control
- **[Theme System](docs/THEME_IMPLEMENTATION_PLAN.md)** - Customization options
- **[Testing Guide](docs/TEST_GUIDE.md)** - How to test features

📖 **[Browse All Documentation →](docs/README.md)**

## 🛠️ Development

```bash
# Frontend
npm run dev              # Start Vite dev server
npm run build            # Production build
npm run lint             # Run ESLint
npm run preview          # Preview production build

# Firebase Functions
cd functions
npm run build            # Compile TypeScript
npm run serve            # Start functions emulator
npm run deploy           # Deploy to Firebase

# Emulators
npm run emulate          # Start all emulators with data import/export
```

## 🏢 Project Structure

```
nutrioffice-ts/
├── src/
│   ├── app/                    # Redux store, services, API
│   │   ├── services/           # Firestore services
│   │   └── state/              # RTK Query slices
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Page components
│   ├── domain/                 # Business entities & types
│   ├── hooks/                  # Custom React hooks
│   ├── infra/                  # Infrastructure (Firebase, AI)
│   └── lib/                    # Utilities
├── functions/                  # Firebase Cloud Functions
│   └── src/
│       ├── api.ts             # Express REST API
│       └── services/          # Email, analytics, etc.
├── docs/                       # 📚 Documentation
└── firestore.rules            # Security rules
```

## 🎨 Key Features in Detail

### Team Collaboration
- Send email invitations to team members
- Role-based access (Professional, Secretary, Collaborator, etc.)
- Granular permissions per resource
- Real-time collaboration

### Permissions System
```tsx
// Protect routes
<PermissionGuard resource="finances" level="read">
  <FinancesPage />
</PermissionGuard>

// Conditional UI
const { canWrite } = usePermissions();
{canWrite("customers") && <CreateButton />}
```

### Customizable Theme
- 12 color presets
- Multiple font options
- Light/Dark mode
- Custom logo and branding
- Border radius customization

## 🧪 Testing

```bash
# Start emulators with test data
npm run emulate

# Run tests
npm test

# E2E tests
npm run test:e2e
```

See [Testing Guide](docs/TEST_GUIDE.md) for detailed testing instructions.

## 🚀 Deployment

```bash
# Build frontend
npm run build

# Deploy to Firebase
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting
```

## 🔐 Security

- Firebase Authentication with custom claims
- Firestore Security Rules for data access
- Role-based access control (RBAC)
- Server-side validation in Cloud Functions
- Secure email delivery with OAuth2

## 📊 Architecture Highlights

- **Hybrid State Management** - RTK Query for server data, Context for UI state
- **Real-time Updates** - Firestore snapshots with RTK Query cache
- **Type Safety** - Full TypeScript coverage
- **Modular Services** - Clean separation of concerns
- **Component Library** - shadcn/ui for consistent design
- **Permission System** - Granular access control

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

[Your License Here]

## 🆘 Support

- 📚 [Documentation](docs/README.md)
- 🐛 [Issue Tracker](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Firebase](https://firebase.google.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**Made with ❤️ for nutrition professionals**
