# NutriOffice Deployment Checklist

Complete checklist for deploying the new version of NutriOffice.

## Pre-Deployment

### 1. Code Preparation
- [ ] All code changes committed to git
- [ ] Code reviewed and tested locally
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] ESLint checks passing (`npm run lint`)
- [ ] Functions build successful (`cd functions && npm run build`)

### 2. Environment Configuration
- [ ] Firebase project selected: `firebase use <project-id>`
- [ ] Environment variables configured in `.env.local`
- [ ] Firebase service account key in place (if needed)

---

## Deployment Steps

### 1. Deploy Firebase Functions

```bash
cd functions
npm run build
npm run deploy
```

**Verify deployed functions:**
- ✓ `initializeAnalytics`
- ✓ `triggerMonthlyAggregation`
- ✓ `aggregateDailyMetrics` (scheduled)
- ✓ `aggregateMonthlyMetrics` (scheduled)
- ✓ All analytics triggers (onCustomerCreated, onConsultaCreated, etc.)

### 2. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 3. Deploy Frontend

```bash
npm run build
firebase deploy --only hosting
```

---

## Post-Deployment Setup

### 1. Set User Custom Claims

For each existing user, set their custom claims:

**Option A: Using Firebase Console**
1. Go to Authentication → Users
2. Select user → Custom Claims
3. Add: `{ "role": "PROFESSIONAL" }`

**Option B: Using the function**
```typescript
// From your app or Firebase Functions shell
const functions = getFunctions();
const redefineCustomClaims = httpsCallable(functions, 'redefineCustomClaims');

await redefineCustomClaims({
  userId: 'USER_UID',
  customClaims: { role: 'PROFESSIONAL' }
});
```

**Option C: Using Firebase CLI**
```bash
firebase functions:shell
> const admin = require('firebase-admin');
> admin.auth().setCustomUserClaims('USER_UID', { role: 'PROFESSIONAL' })
```

### 2. Initialize Analytics for Each User

**Using the UI Component:**
1. Add `<InitializeAnalyticsButton />` to settings page
2. User clicks "Initialize Analytics Counters"
3. Verify in Firebase Console: `users/{uid}/analytics/counters`

**Using code:**
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const initializeAnalytics = httpsCallable(functions, 'initializeAnalytics');

const result = await initializeAnalytics();
console.log('Initialized:', result.data);
```

**Expected result:**
```json
{
  "success": true,
  "counters": {
    "totalCustomers": 150,
    "totalConsultations": 450,
    "totalConsultationsThisMonth": 25,
    "totalRevenue": 75000,
    "totalRevenueThisMonth": 5000,
    "outstandingBalance": 12000
  }
}
```

### 3. Generate Monthly Metrics

**Using the UI Component:**
1. Click "Aggregate Last Month Metrics"
2. Verify in Firebase Console: `users/{uid}/analytics/monthly/{YYYY-MM}`

**Using code:**
```typescript
const triggerMonthlyAggregation = httpsCallable(functions, 'triggerMonthlyAggregation');

const result = await triggerMonthlyAggregation();
console.log('Month:', result.data.monthKey);
console.log('Metrics:', result.data.metrics);
```

**Expected result:**
```json
{
  "success": true,
  "monthKey": "2025-10",
  "metrics": {
    "newCustomers": 12,
    "totalConsultations": 85,
    "revenue": 15000,
    "activeCustomers": 45,
    "averageRevenuePerCustomer": 333.33
  }
}
```

### 4. Load Default Settings

Check if default settings exist for each user:

```typescript
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const settingsRef = doc(db, `users/${uid}/settings/anamnesis`);
const settingsDoc = await getDoc(settingsRef);

if (!settingsDoc.exists()) {
  await setDoc(settingsRef, {
    fields: [
      // Your default anamnesis fields
    ],
    createdAt: serverTimestamp()
  });
}
```

---

## Verification Checklist

### Analytics Data
- [ ] `/users/{uid}/analytics/counters` document exists
- [ ] `totalCustomers` matches actual customer count
- [ ] `totalConsultations` matches actual consulta count
- [ ] `totalRevenue` matches sum of all finances
- [ ] `outstandingBalance` matches sum of all `saldo` fields

### Monthly Rollups
- [ ] `/users/{uid}/analytics/monthly/{YYYY-MM}` documents exist
- [ ] Previous month data is aggregated
- [ ] Metrics look accurate (newCustomers, revenue, etc.)

### Scheduled Functions
- [ ] Cloud Scheduler shows both scheduled functions
- [ ] Functions are enabled and not paused
- [ ] Next execution times are correct
  - `aggregateDailyMetrics`: Daily at 2 AM (Sao Paulo time)
  - `aggregateMonthlyMetrics`: 1st of month at 3 AM (Sao Paulo time)

### User Access
- [ ] Users can log in successfully
- [ ] Custom claims are applied (check Network tab → Token)
- [ ] Users can access their data
- [ ] RBAC working correctly (collaborators have limited access)

### Frontend Features
- [ ] Dashboard loads analytics correctly
- [ ] "Receita Anual" shows current year revenue
- [ ] "Receita do Mês" shows current month revenue
- [ ] Finances table displays without NaN values
- [ ] "Receita por Mês" chart displays data
- [ ] No console errors

---

## Troubleshooting

### Function Deployment Failed
```bash
# Check function logs
firebase functions:log

# Redeploy specific function
firebase deploy --only functions:functionName

# Check Node version (should be 20)
node --version
```

### Analytics Not Initializing
1. Check user is authenticated
2. Verify function is deployed: `firebase functions:list`
3. Check function logs: `firebase functions:log`
4. Ensure user has proper permissions

### Monthly Aggregation Shows Zero
1. Check if daily rollups exist: `/users/{uid}/analytics/daily/*`
2. If no daily rollups, the monthly aggregation will be zero
3. This is expected if it's the first run
4. Daily rollups will start accumulating from tomorrow's scheduled run

### Custom Claims Not Working
```typescript
// Refresh user token
await auth.currentUser?.getIdToken(true);

// Verify claims in token
const token = await auth.currentUser?.getIdTokenResult();
console.log('Claims:', token?.claims);
```

### Firestore Permission Denied
1. Check Firestore rules are deployed
2. Verify user has correct custom claims
3. Check `contributesTo` field for collaborators
4. Ensure user is in owner's contributors subcollection

---

## Rollback Plan

If issues arise after deployment:

### 1. Rollback Functions
```bash
# List recent deployments
firebase functions:list

# Rollback to previous version
firebase functions:rollback <functionName>
```

### 2. Rollback Firestore Rules
```bash
# In Firebase Console → Firestore → Rules
# Click "History" tab and restore previous version
```

### 3. Rollback Frontend
```bash
# Redeploy previous git commit
git checkout <previous-commit>
npm run build
firebase deploy --only hosting
```

---

## Success Criteria

Deployment is successful when:

✅ All functions deployed and running
✅ All users have custom claims set
✅ Analytics counters initialized for all users
✅ Monthly metrics generated for previous month
✅ Scheduled functions are active
✅ Frontend loads without errors
✅ Users can access all features
✅ No critical bugs reported
✅ Performance is acceptable (< 3s page load)

---

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Monitor function invocations in Firebase Console
- [ ] Check for error spikes in logs
- [ ] Verify scheduled functions execute successfully
- [ ] Monitor user feedback

### First Week
- [ ] Daily rollups accumulating correctly
- [ ] Analytics counters updating in real-time
- [ ] No unexpected costs or quota issues
- [ ] User engagement metrics stable

### First Month
- [ ] Monthly aggregation runs successfully on 1st
- [ ] All analytics data is accurate
- [ ] No performance degradation
- [ ] User satisfaction maintained

---

## Support Contacts

If you encounter issues:

1. Check Firebase Console logs
2. Review [Setup Guide](./setup-guide.md)
3. Check GitHub issues
4. Contact support team

---

**Last Updated:** 2025-11-30
**Version:** 1.0.0
