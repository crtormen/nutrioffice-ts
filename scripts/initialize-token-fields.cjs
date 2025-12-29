/**
 * Script to initialize enabledFields and enabledEvaluationFields for existing tokens
 * Run with: node scripts/initialize-token-fields.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../functions/src/serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nutri-office.firebaseio.com"
});

const db = admin.firestore();

async function initializeTokenFields() {
  try {
    console.log('🔍 Finding users with tokens...');

    const usersSnapshot = await db.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\n👤 Processing user: ${userId}`);

      // Get anamnesis fields
      const defaultSettingsDoc = await db.doc(`users/${userId}/settings/default`).get();
      const anamnesisFields = defaultSettingsDoc.data()?.anamnesis || {};
      const enabledFields = Object.keys(anamnesisFields);

      console.log(`  📋 Found ${enabledFields.length} anamnesis fields`);

      // Get evaluation config
      const evaluationSettingsDoc = await db.doc(`users/${userId}/settings/evaluation`).get();
      const evaluationConfig = evaluationSettingsDoc.data();

      // Process both token types
      for (const type of ['online', 'presencial']) {
        const tokenRef = db.doc(`users/${userId}/anamnesisFormTokens/${type}`);
        const tokenDoc = await tokenRef.get();

        if (!tokenDoc.exists) {
          console.log(`  ⏭️  No ${type} token found`);
          continue;
        }

        const tokenData = tokenDoc.data();
        const updates = {};

        // Initialize enabledFields if missing
        if (!tokenData.enabledFields || tokenData.enabledFields.length === 0) {
          updates.enabledFields = enabledFields;
          console.log(`  ✅ Initializing ${enabledFields.length} anamnesis fields for ${type}`);
        }

        // Initialize enabledEvaluationFields if missing
        if (!tokenData.enabledEvaluationFields && evaluationConfig && evaluationConfig[type]) {
          const config = evaluationConfig[type];
          updates.enabledEvaluationFields = {
            weight: config.fields?.weight?.enabled || false,
            height: config.fields?.height?.enabled || false,
            measures: config.fields?.measures?.points?.filter(p => p.enabled).map(p => p.id) || [],
            photos: config.fields?.photos?.enabled || false,
            folds: false,
            bioimpedance: false,
          };
          console.log(`  ✅ Initializing evaluation fields for ${type}`);
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          await tokenRef.update(updates);
          console.log(`  💾 Saved updates for ${type} token`);
        } else {
          console.log(`  ✓ ${type} token already initialized`);
        }
      }
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

initializeTokenFields();
