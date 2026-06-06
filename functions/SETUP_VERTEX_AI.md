# Setting Up Vertex AI for Body Vision Analysis

## Error: Permission 'aiplatform.endpoints.predict' denied

This means the Vertex AI API is not enabled or your service account lacks permissions.

## Solution: Enable Vertex AI API and Grant Permissions

### Step 1: Enable Vertex AI API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **nutri-office**
3. Go to **APIs & Services** → **Library**
4. Search for **"Vertex AI API"**
5. Click on **Vertex AI API**
6. Click **ENABLE**

Or use this direct link:
https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=nutri-office

### Step 2: Grant Service Account Permissions

Your service account needs the **Vertex AI User** role.

#### Option A: Using Google Cloud Console (Recommended)

1. Go to [IAM & Admin](https://console.cloud.google.com/iam-admin/iam?project=nutri-office)
2. Find your service account (it should look like: `firebase-adminsdk-xxxxx@nutri-office.iam.gserviceaccount.com`)
3. Click the **pencil icon** (Edit) next to it
4. Click **ADD ANOTHER ROLE**
5. Search for **"Vertex AI User"**
6. Select **Vertex AI User** role
7. Click **SAVE**

#### Option B: Using gcloud CLI

```bash
# Get your service account email from serviceAccount.json
SERVICE_ACCOUNT_EMAIL=$(cat functions/src/serviceAccount.json | grep "client_email" | cut -d'"' -f4)

# Grant Vertex AI User role
gcloud projects add-iam-policy-binding nutri-office \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/aiplatform.user"
```

### Step 3: Verify Permissions

After enabling the API and granting permissions, wait 1-2 minutes for changes to propagate, then retry your test:

```bash
cd functions
node lib/test/testWithHistoricalData.js <userId> <customerId> <consultaId>
```

## Alternative: Use a Different Service Account

If you don't have permissions to modify IAM roles, you can create a new service account:

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=nutri-office)
2. Click **CREATE SERVICE ACCOUNT**
3. Name: `vertex-ai-service-account`
4. Click **CREATE AND CONTINUE**
5. Grant roles:
   - **Vertex AI User**
   - **Firebase Admin SDK Administrator Service Agent** (for Firebase access)
   - **Storage Object Viewer** (for Firebase Storage access)
6. Click **CONTINUE** → **DONE**
7. Click on the new service account
8. Go to **KEYS** tab
9. Click **ADD KEY** → **Create new key** → **JSON**
10. Download the JSON file
11. Replace `functions/src/serviceAccount.json` with the new file
12. Update `.env`: `GOOGLE_APPLICATION_CREDENTIALS=src/serviceAccount.json`

## Troubleshooting

### Error persists after enabling API

- Wait 1-2 minutes for permissions to propagate
- Verify the API is enabled: https://console.cloud.google.com/apis/dashboard?project=nutri-office
- Check that Vertex AI API shows as "Enabled"

### Service account doesn't have enough permissions

The service account needs these roles:
- ✅ **Vertex AI User** - For Gemini API calls
- ✅ **Firebase Admin** - For Firestore/Storage access
- ✅ **Service Account Token Creator** (optional, for advanced features)

### Still getting 403 errors

1. Check you're using the correct project ID in `.env`: `GOOGLE_CLOUD_PROJECT_ID=nutri-office`
2. Verify service account JSON is valid: `cat functions/src/serviceAccount.json | head -5`
3. Make sure you're running from the `functions` directory
4. Rebuild after any changes: `npm run build`

## Cost Considerations

**Vertex AI Pricing:**
- Gemini 2.0 Flash: ~$0.0007 per analysis
- First 1,000 requests per month are often free (check current pricing)
- No charges until you exceed free tier

**Enable Budget Alerts:**
1. Go to [Billing](https://console.cloud.google.com/billing)
2. Set up budget alerts at $10, $50, $100
3. This prevents unexpected charges

## Security Note

⚠️ **Never commit serviceAccount.json to git**

The `.gitignore` should already include:
```
functions/src/serviceAccount.json
functions/.env
```

Verify:
```bash
git check-ignore functions/src/serviceAccount.json
# Should output: functions/src/serviceAccount.json
```

## Next Steps

Once permissions are granted and the API is enabled:

1. ✅ Test with a single consulta
2. ✅ Verify accuracy compared to manual measurements
3. ✅ Run batch accuracy test with 50+ consultas
4. ✅ Evaluate if RMSE < 5% and R² > 0.8

See [functions/src/test/README.md](functions/src/test/README.md) for detailed testing instructions.
