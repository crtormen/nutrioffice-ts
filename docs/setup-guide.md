# NutriOffice Setup Guide

This guide helps you initialize the application after deployment or for new users.

## Prerequisites

- Firebase CLI installed and configured
- Functions deployed to Firebase
- User authenticated in the application

## Manual Initialization Steps

### 1. Initialize Analytics Counters

This function calculates and sets up initial analytics counters for a user by scanning all existing data.

**Using Firebase Console:**
1. Go to Firebase Console → Functions
2. Find the function `initializeAnalytics`
3. Click "Test function"
4. Ensure you're authenticated

**Using code (from your app):**
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const initializeAnalytics = httpsCallable(functions, 'initializeAnalytics');

try {
  const result = await initializeAnalytics();
  console.log('Analytics initialized:', result.data);
} catch (error) {
  console.error('Failed to initialize analytics:', error);
}
```

**What it does:**
- Counts all customers
- Counts all consultations (total and this month)
- Calculates total revenue and outstanding balance
- Sets up the `/users/{uid}/analytics/counters` document

---

### 2. Trigger Monthly Aggregation

This function aggregates the previous month's data into monthly rollups.

**Using Firebase Console:**
1. Go to Firebase Console → Functions
2. Find the function `triggerMonthlyAggregation`
3. Click "Test function"

**Using code (from your app):**
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const triggerMonthlyAggregation = httpsCallable(functions, 'triggerMonthlyAggregation');

try {
  const result = await triggerMonthlyAggregation();
  console.log('Monthly aggregation complete:', result.data);
  console.log('Month:', result.data.monthKey);
  console.log('Metrics:', result.data.metrics);
} catch (error) {
  console.error('Failed to aggregate monthly metrics:', error);
}
```

**What it does:**
- Aggregates the previous month's data
- Creates a document at `/users/{uid}/analytics/monthly/{YYYY-MM}`
- Includes: newCustomers, totalConsultations, revenue, activeCustomers, averageRevenuePerCustomer

---

### 3. Set User Custom Claims

Custom claims are needed for role-based access control (RBAC).

**Using Firebase CLI:**
```bash
# For a professional user
firebase functions:shell
> const admin = require('firebase-admin');
> admin.auth().setCustomUserClaims('USER_UID_HERE', { role: 'PROFESSIONAL' })
```

**Using the existing `redefineCustomClaims` function:**

From your app:
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const redefineCustomClaims = httpsCallable(functions, 'redefineCustomClaims');

try {
  await redefineCustomClaims({
    userId: 'USER_UID_HERE',
    customClaims: {
      role: 'PROFESSIONAL'
    }
  });
  console.log('Custom claims set successfully');

  // User needs to refresh their token
  await auth.currentUser?.getIdToken(true);
} catch (error) {
  console.error('Failed to set custom claims:', error);
}
```

**Available roles:**
- `PROFESSIONAL` - Full access to their data
- `COLLABORATOR` - Limited access (requires `contributesTo` field)
- `SECRETARY` - Administrative tasks
- `MARKETING` - Marketing related tasks
- `FINANCES` - Finance related tasks
- `ADMIN` - System administrator

---

### 4. Load Default Settings

Default settings should be loaded for new users. This typically happens automatically on user creation, but you can manually trigger it.

**Check if settings exist:**
```typescript
const settingsRef = doc(db, `users/${uid}/settings/anamnesis`);
const settingsDoc = await getDoc(settingsRef);

if (!settingsDoc.exists()) {
  // Create default settings
  await setDoc(settingsRef, {
    fields: {
      // Your default anamnesis fields
    },
    createdAt: serverTimestamp()
  });
}
```

---

## Complete Initialization Script

Here's a complete script you can run to initialize a new user:

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

async function initializeUser() {
  const auth = getAuth();
  const functions = getFunctions();

  if (!auth.currentUser) {
    console.error('User not authenticated');
    return;
  }

  console.log('Initializing user:', auth.currentUser.uid);

  try {
    // Step 1: Initialize analytics counters
    console.log('1. Initializing analytics...');
    const initAnalytics = httpsCallable(functions, 'initializeAnalytics');
    const analyticsResult = await initAnalytics();
    console.log('✓ Analytics initialized:', analyticsResult.data);

    // Step 2: Trigger monthly aggregation (for previous month)
    console.log('2. Aggregating monthly metrics...');
    const triggerAggregation = httpsCallable(functions, 'triggerMonthlyAggregation');
    const aggregationResult = await triggerAggregation();
    console.log('✓ Monthly aggregation complete:', aggregationResult.data);

    // Step 3: Refresh user token to get latest claims
    console.log('3. Refreshing authentication token...');
    await auth.currentUser.getIdToken(true);
    console.log('✓ Token refreshed');

    console.log('\n✓ User initialization complete!');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  }
}

// Call the function
initializeUser();
```

---

## Scheduled Functions

These functions run automatically:

- **`aggregateDailyMetrics`** - Runs daily at 2 AM (Sao Paulo time)
- **`aggregateMonthlyMetrics`** - Runs on the 1st of each month at 3 AM (Sao Paulo time)

You don't need to trigger these manually after initial setup.

---

## Troubleshooting

### "User must be authenticated" error
- Make sure you're logged in before calling the functions
- Refresh your authentication token: `await auth.currentUser?.getIdToken(true)`

### "Permission denied" errors
- Check that custom claims are set correctly
- Verify Firestore security rules allow the operation
- Ensure the user has the correct role

### Analytics showing zero
- Run `initializeAnalytics` to recalculate counters
- Check that data exists in Firestore
- Verify the date formats are correct (dd/MM/yyyy for consultas)

### Monthly metrics missing
- Daily aggregations need to run first (or manually create daily rollups)
- Run `triggerMonthlyAggregation` to generate monthly data
- Check that consultas have valid dates

---

## Post-Deployment Checklist

After deploying the new version:

- [ ] Deploy functions: `cd functions && npm run deploy`
- [ ] Set custom claims for existing users
- [ ] Run `initializeAnalytics` for each user
- [ ] Run `triggerMonthlyAggregation` for each user
- [ ] Verify analytics data in Firebase Console
- [ ] Test that scheduled functions are enabled
- [ ] Check Firestore security rules are deployed
- [ ] Verify frontend can read analytics data
