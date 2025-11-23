# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NutriOffice-TS is a nutrition practice management system built as a React SPA with Firebase backend. It manages customers (patients), consultations, anamnesis records, body composition tracking, and financial operations for nutrition professionals.

## Development Commands

### Frontend
```bash
npm run dev              # Start Vite dev server
npm run build            # TypeScript compilation + production build
npm run lint             # Run ESLint on .tsx files
npm run lint-fix         # Auto-fix ESLint issues
npm run preview          # Preview production build
```

### Firebase Functions
```bash
cd functions
npm run build            # Compile TypeScript to lib/
npm run build:watch      # Watch mode compilation
npm run serve            # Build and start functions emulator
npm run deploy           # Deploy functions to Firebase
npm run logs             # View function logs
```

**TypeScript Version:** 5.9.3 (supports modern import attributes with `with` syntax)

### Firebase Emulators
```bash
npm run emulate          # Start auth, firestore, storage, functions emulators
                        # Imports from ./saved-data and exports on exit
npm run serve            # Start all emulators (no import/export)
```

**Emulator Ports:**
- Auth: 9099
- Firestore: 8080
- Functions: 5001
- Storage: 9199
- Hosting: 5000

## Architecture

### State Management Philosophy

The app uses a **hybrid state management approach**:

1. **RTK Query (`firestoreApi`)** - Primary data fetching/caching layer
   - All Firestore operations go through RTK Query endpoints
   - Defined in `src/app/state/firestoreApi.ts` with tag-based invalidation
   - Feature slices in `src/app/state/features/` inject endpoints into base API
   - Real-time subscriptions via `onCacheEntryAdded` lifecycle

2. **Context API** - Scoped local state
   - `AuthContext` - Authentication state, managed via Firebase Auth observers
   - Feature-specific contexts (Consultas, Settings) for form state

3. **No Redux slices for global state** - All server data lives in RTK Query cache

### Authentication & Authorization

**Custom Claims System:**
- Firebase Auth stores user roles in JWT custom claims
- `contributesTo` field enables multi-user practice management
- Collaborators work under a professional's account (their `uid` points to the professional's `uid`)
- `dbUid` in AuthContext determines which user's data to query (own uid OR contributesTo uid)

**Roles:** PROFESSIONAL, COLLABORATOR, SECRETARY, MARKETING, FINANCES, ADMIN

**Firestore Security:**
```
users/{userId}/* - Owner OR contributor with valid custom claim
```

The `isContributor()` function in firestore.rules validates:
1. User has COLLABORATOR role
2. `contributesTo` claim matches the userId being accessed
3. User's uid exists in owner's contributors subcollection

### Data Flow Pattern

**Timestamp Conversion:**
- Firebase stores dates as `Timestamp` objects
- Domain entities have two interfaces:
  - `I{Entity}Firebase` - Uses Firestore `Timestamp` type
  - `I{Entity}` - Uses `string` (ISO date format)
- Converters in slice files transform between Firebase ↔ App types

**RTK Query Real-time Pattern:**
```typescript
// Example from customersSlice.ts
fetchCustomers: builder.query({
  queryFn: () => ({ data: [] }),  // Initial empty state
  onCacheEntryAdded: async (uid, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) => {
    await cacheDataLoaded;
    const unsubscribe = CustomersService(uid)?.getAll((snapshot) => {
      updateCachedData((draft) => {
        // Real-time updates pushed to cache
      });
    });
    await cacheEntryRemoved;
    unsubscribe();
  }
})
```

### Routing Architecture

**Route Protection:**
- `RequireAuthLayout` wraps all protected routes
- Accepts `allowedRoles` prop for RBAC
- Redirects to `/login` if unauthenticated
- Redirects to `/unauthorized` if insufficient permissions

**Route Organization:**
- `AppRouter.tsx` - Main router with lazy-loaded pages
- `customerRoutes.tsx` - Customer-related route definitions
- `consultaRoutes.tsx` - Consultation-related route definitions
- `routes.ts` - Centralized route path constants

**Use `ROUTES` constants** from `src/app/router/routes.ts` for navigation - never hardcode paths.

### Firebase Cloud Functions

**All functions use Firebase Functions v2** for better performance, improved cold start times, and modern features.

**Function Organization:**
- `functions/src/firebase-admin.ts` - Shared Firebase Admin initialization (singleton pattern)
- `functions/src/api.ts` - Express REST API (v2 `onRequest`)
- `functions/src/new.ts` - User management and v2 cloud functions
- `functions/src/old.ts` - Legacy business logic functions (migrated to v2)
- `functions/src/index.ts` - Export all functions for deployment

**Express API Pattern (v2):**
```typescript
// functions/src/api.ts
import { db, auth } from "./firebase-admin.js";

const app = express();
app.use(cors({ origin: true }));
app.use(authenticateUser);  // Verifies Bearer token with Firebase Admin SDK

app.get('/users/:userId/customers', async (req, res) => {
  // Handler implementation using shared db instance
});

export const api = functions.https.onRequest(app);
```

**v2 Callable Function Pattern:**
```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";

export const myFunction = onCall(
  { timeoutSeconds: 300, memory: "2GiB" },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Function logic
    return { result: "data" };
  }
);
```

**v2 Firestore Triggers:**
```typescript
import { onDocumentWritten } from "firebase-functions/v2/firestore";

export const onDocUpdate = onDocumentWritten(
  { document: "users/{userId}/..." },
  async (event) => {
    const data = event.data?.after.data();
    // Handle document changes
  }
);
```

**Import Attributes (Modern Syntax):**
Functions use TypeScript 5.9+ with modern import attributes:
```typescript
import serviceAccount from "./serviceAccount.json" with { type: "json" };
```

**Custom Claims Management:**
- `createAuthUser` - Creates users with initial role claims
- `redefineCustomClaims` - Updates role/contributesTo claims
- `onCreateFirestoreUserSetCustomClaims` - Auto-sets claims on user creation
- `onUpdateFirestoreUser` - Updates claims when user doc changes
- Changes require client token refresh to take effect

### UI Component System

**shadcn/ui Configuration:**
- Style: "New York"
- Base color: Slate
- CSS variables in `src/assets/global.css`
- Path alias: `@/components/ui`

**Component Guidelines:**
- Radix UI primitives for accessible components
- Tailwind CSS with `cn()` utility for class merging
- Dark mode via `next-themes` (class-based strategy)
- Icons from `lucide-react`

## Key Architectural Patterns

### Service Layer Pattern
Services in `src/app/services/` wrap Firestore operations:
```typescript
export const CustomersService = (uid?: string) => {
  if (!uid) return null;
  return {
    getAll: (callback) => onSnapshot(query(...), callback),
    getAllOnce: () => getDocs(query(...)),
    getById: (customerId) => getDoc(doc(...)),
    // ... CRUD operations
  };
};
```

Services return `null` if `uid` is missing - always null-check before using.

### Form Validation
- React Hook Form + Zod schemas
- Zod schemas often defined inline near form components
- Use `@hookform/resolvers/zod` for integration

### File Upload Pattern
- React Dropzone for file selection
- Upload to Firebase Storage via `uploadBytes()`
- Store download URLs in Firestore documents
- Common pattern: consultation images (front/back/side views)

## Firestore Database Structure

```
users/
  {userId}/
    # User profile and settings documents
    customers/
      {customerId}/
        # Customer data
        anamnesis/
          {anamnesisId}/
            # Anamnesis records
        consultas/
          {consultaId}/
            # Consultation records
            goals/
              {goalId}/
                # Goals set during consultation
        finances/
          {financeId}/
          # Finance records
          # Payments
    consultas/
      {consultaId}/
            # Simpler Consultation records
    finances/
      {financeId}/
        # Simpler finances records
    contributors/
      {contributorId}/
        # Collaborator access records
    settings/
      # User preferences, anamnesis field configs
settings/
  contributor/
    # General Contributor settings
  professional/
``` # General professional settings

## Common Development Patterns

### Adding a New RTK Query Endpoint

1. Create/update slice in `src/app/state/features/`:
```typescript
export const entitySlice = firestoreApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchEntities: builder.query<Entity[], string>({
      providesTags: ['Entities'],
      // ... implementation
    }),
    addEntity: builder.mutation<void, NewEntity>({
      invalidatesTags: ['Entities'],
      // ... implementation
    }),
  }),
});
```

2. Export hooks: `export const { useFetchEntitiesQuery, useAddEntityMutation } = entitySlice;`

3. Add tag type to `firestoreApi.ts` if new

### Adding Protected Routes

```typescript
// In route file
<Route path="newpath" element={
  <RequireAuthLayout allowedRoles={["PROFESSIONAL", "ADMIN"]}>
    <NewPage />
  </RequireAuthLayout>
} />
```

### Working with Timestamps

```typescript
// Firestore → App
const customer: ICustomer = {
  ...firestoreData,
  birthday: firestoreData.birthday?.toDate().toISOString(),
};

// App → Firestore
const firestoreData: ICustomerFirebase = {
  ...appData,
  birthday: Timestamp.fromDate(new Date(appData.birthday)),
};
```

## Path Aliases

`@/*` resolves to `src/*` (configured in vite.config.ts and tsconfig.json)

## Environment Variables

Required in `.env.local`:
```
VITE_FIREBASE_API_KEY=
VITE_AUTH_DOMAIN=
VITE_DATABASE_URL=
VITE_PROJECT_ID=
VITE_STORAGE_BUCKET=
VITE_MESSAGING_SENDER_ID=
VITE_APP_ID=
VITE_MEASUREMENT_ID=
```

## Testing Locally

1. Start Firebase emulators: `npm run emulate`
2. Start dev server: `npm run dev`
3. Access at http://localhost:5173
4. Firebase Emulator UI at http://localhost:4000

Data persists across emulator restarts via `./saved-data` directory.

## Deployment

```bash
# Frontend (hosting)
npm run build
firebase deploy --only hosting

# Functions
cd functions && npm run deploy

# Full deployment
firebase deploy
```

## Code Style

- ESLint config: `@rocketseat/eslint-config`
- Prettier with `prettier-plugin-tailwindcss`
- TypeScript strict mode enabled
- Functional components with TypeScript
- Hooks for state/effects (no class components)
