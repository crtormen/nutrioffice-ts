# AI Body Vision Analysis - Testing Infrastructure

This directory contains test scripts for validating the AI-powered body composition analysis system.

## Prerequisites

1. **Environment Setup**
   - Ensure `GOOGLE_CLOUD_PROJECT_ID` is set in `/functions/.env`
   - Firebase service account credentials in `/functions/src/serviceAccount.json`
   - Google Cloud Vertex AI API enabled for your project
   - The `dotenv` package is installed (should be automatically installed with `npm install`)

2. **Verify .env file**
   ```bash
   cat functions/.env | grep GOOGLE_CLOUD_PROJECT_ID
   # Should output: GOOGLE_CLOUD_PROJECT_ID=nutri-office
   ```

3. **Build the Functions**
   ```bash
   cd functions
   npm run build
   ```

## Test Scripts

### 1. Basic API Validation Test

**File:** `testBodyVisionAnalysis.ts`

Tests the AI service with sample data (requires manual URL configuration).

**Usage:**
```bash
node lib/test/testBodyVisionAnalysis.js
```

**Before running:**
1. Open `functions/src/test/testBodyVisionAnalysis.ts`
2. Replace placeholder URLs with actual Firebase Storage URLs:
   ```typescript
   images: {
     front: "gs://nutri-office.appspot.com/images/...",
     back: "gs://nutri-office.appspot.com/images/...",
     side: "gs://nutri-office.appspot.com/images/...",
   }
   ```
3. Rebuild: `npm run build`
4. Run the test

**What it tests:**
- ✓ Vertex AI API connectivity
- ✓ Image fetching from Firebase Storage
- ✓ Base64 conversion
- ✓ Gemini Vision API response parsing
- ✓ Body composition calculations
- ✓ Confidence scoring
- ✓ Image quality assessment

---

### 2. Historical Data Test

**File:** `testWithHistoricalData.ts`

Tests with real consultas from your Firestore database and compares AI results with manual measurements.

**Usage:**
```bash
node lib/test/testWithHistoricalData.js <userId> <customerId> <consultaId>
```

**Example:**
```bash
node lib/test/testWithHistoricalData.js ABC123 customer_456 consulta_789
```

**How to find IDs:**
1. Go to Firebase Console → Firestore
2. Navigate to: `users/{userId}/customers/{customerId}/consultas/{consultaId}`
3. Make sure the consulta has:
   - `images.img_frente` (front view photo)
   - `images.img_costas` (back view photo)
   - `images.img_lado` (side view photo)
   - `results.fat` (manual body fat percentage)

**What it tests:**
- ✓ Full end-to-end flow with real data
- ✓ Comparison: AI vs Manual measurements
- ✓ Accuracy metrics (relative error)
- ✓ Image quality from real photos
- ✓ Anomaly detection

**Example Output:**
```
=== Comparison with Manual Measurements ===

Body Fat Percentage:
- Manual: 18.5%
- AI: 19.2%
- Difference: 0.7% (✓ Good)

Relative Error (Body Fat): 3.78%
Status: ✓ PASS
```

---

### 3. Batch Accuracy Test

**File:** `batchAccuracyTest.ts`

Automatically finds and tests multiple consultas to calculate statistical accuracy metrics.

**Usage:**
```bash
node lib/test/batchAccuracyTest.js <userId> [limit]
```

**Example:**
```bash
# Test up to 50 consultas
node lib/test/batchAccuracyTest.js ABC123 50

# Test up to 100 consultas
node lib/test/batchAccuracyTest.js ABC123 100
```

**What it calculates:**
- **RMSE** (Root Mean Square Error) - Average prediction error
- **MAE** (Mean Absolute Error) - Average absolute error
- **R²** (Coefficient of Determination) - Correlation strength (0-1)
- **Within ±3%** - Percentage of predictions within ±3% of manual measurements

**Phase 1 Success Criteria:**
- ✓ RMSE < 5%
- ✓ R² > 0.8
- ✓ > 80% of predictions within ±3%

**Example Output:**
```
=== Accuracy Metrics ===

Tests: 48/50 successful
Failed: 2

Body Fat Percentage Accuracy:
- RMSE: 4.44%
- MAE: 3.21%
- R²: 0.812
- Within ±3%: 42/48 (87.5%)

Average Metrics:
- Confidence: 78.3%
- Image Quality: 82.1/100

=== Target Thresholds (Phase 1 Goals) ===
RMSE < 5%: ✓ PASS (4.44%)
R² > 0.8: ✓ PASS (0.812)
Within ±3% > 80%: ✓ PASS (87.5%)

✓ Results saved to: accuracy-test-results-1234567890.json
```

**Output File:**
Results are saved to `accuracy-test-results-{timestamp}.json` with detailed data for each test case.

---

## Troubleshooting

### Error: "GOOGLE_CLOUD_PROJECT_ID environment variable is required"

**Solution:** Add to `/functions/.env`:
```
GOOGLE_CLOUD_PROJECT_ID=nutri-office
```

### Error: "Anonymous caller does not have storage.objects.get access"

**Cause:** Storage authentication issue (FIXED in latest version)

**Solution:**
- Ensure you're using the latest build: `npm run build`
- The service now uses Firebase Admin Storage with proper authentication
- Verify `serviceAccount.json` exists in `/functions/src/`

### Error: "Invalid Firebase Storage URL format"

**Cause:** Image URLs are not in expected format

**Solution:** Ensure image URLs are either:
- gs:// format: `gs://nutri-office.appspot.com/images/...`
- HTTPS format: `https://firebasestorage.googleapis.com/v0/b/nutri-office.appspot.com/o/...`

### Error: "No valid images could be prepared for analysis"

**Cause:** All 3 images failed to load

**Solution:**
1. Check that images exist in Firebase Storage
2. Verify URLs are correct and accessible
3. Check Firebase Storage security rules
4. Ensure service account has storage.objects.get permission

### Error: "Gemini API error: ..."

**Possible causes:**
1. **Quota exceeded:** Check Vertex AI quotas in Google Cloud Console
2. **API not enabled:** Enable Vertex AI API in Google Cloud Console
3. **Invalid credentials:** Verify service account permissions
4. **Rate limiting:** Add delays between batch tests (already implemented)

**Solution for rate limiting:**
The batch test already includes 1-second delays. For higher volume, increase the delay:
```typescript
// In batchAccuracyTest.ts, line ~280
await new Promise((resolve) => setTimeout(resolve, 2000)); // Increase to 2 seconds
```

### Low Accuracy Results

**If RMSE > 5% or R² < 0.8:**

1. **Check image quality:**
   - Review `imageQuality.overallQuality` scores
   - Low quality (<70) impacts accuracy
   - May need better photos for training

2. **Review anomalies:**
   - Check what anomalies are being detected
   - Common issues: poor lighting, blurred images, wrong positioning

3. **Verify manual measurements:**
   - Ensure manual measurements are accurate
   - Cross-check a few samples manually

4. **Sample size:**
   - Test with at least 50+ consultas for reliable metrics
   - More data = more reliable statistics

---

## Cost Tracking

Each AI analysis costs approximately **$0.0007 USD** with Gemini 2.0 Flash.

**Estimated costs for testing:**
- 10 tests: $0.007
- 50 tests: $0.035
- 100 tests: $0.070
- 500 tests: $0.350

The batch test saves detailed results to JSON, so you can reuse test data without re-running expensive API calls.

---

## Next Steps After Testing

### Phase 1 POC Complete ✓
Once accuracy metrics meet targets (RMSE <5%, R² >0.8, >80% within ±3%):

1. **Document findings** in a validation report
2. **Move to Phase 2:** Integrate into Firebase Functions
3. **Implement professional review workflow**
4. **Add cost tracking to production**

### Phase 2: Production Integration
- Create Firestore trigger: `onConsultaImagesComplete`
- Add API endpoints: reanalyze, approve, override
- Implement RTK Query hooks
- Build frontend UI components

See `/home/crtormen/.claude/plans/modular-mapping-pebble.md` for complete implementation plan.

---

## Support

For issues or questions:
1. Check logs in Firebase Functions console
2. Review Vertex AI logs in Google Cloud Console
3. Verify all prerequisites are met
4. Ensure test consultas have all required fields

**Key Files:**
- Service: `/functions/src/services/BodyVisionAnalysisService.ts`
- Tests: `/functions/src/test/*.ts`
- Plan: `/home/crtormen/.claude/plans/modular-mapping-pebble.md`
