/**
 * Migration script to update evaluation configs and tokens with proper label structure
 * Run with: cd functions && node ../scripts/migrate-evaluation-labels.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require(path.join(__dirname, '../functions/src/serviceAccount.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://nutri-office.firebaseio.com"
  });
}

const db = admin.firestore();

async function migrateEvaluationLabels() {
  try {
    console.log('🚀 Starting evaluation labels migration...\n');

    const usersSnapshot = await db.collection('users').get();
    let totalUsers = 0;
    let updatedTokens = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      totalUsers++;

      console.log(`\n👤 Processing user: ${userId}`);

      // Get evaluation config
      const evaluationDoc = await db.doc(`users/${userId}/settings/evaluation`).get();
      const evaluationConfig = evaluationDoc.data();

      if (!evaluationConfig) {
        console.log(`  ⏭️  No evaluation config found`);
        continue;
      }

      // Process both token types
      for (const type of ['online', 'presencial']) {
        const tokenRef = db.doc(`users/${userId}/anamnesisFormTokens/${type}`);
        const tokenDoc = await tokenRef.get();

        if (!tokenDoc.exists) {
          console.log(`  ⏭️  No ${type} token found`);
          continue;
        }

        const tokenData = tokenDoc.data();
        const enabledEvalFields = tokenData.enabledEvaluationFields;

        if (!enabledEvalFields) {
          console.log(`  ⏭️  No enabled evaluation fields in ${type} token`);
          continue;
        }

        // Check if measures is an array of strings (old format) or objects (new format)
        if (enabledEvalFields.measures && Array.isArray(enabledEvalFields.measures)) {
          const firstMeasure = enabledEvalFields.measures[0];

          // If it's already an object with 'id' and 'label', skip
          if (firstMeasure && typeof firstMeasure === 'object' && firstMeasure.id && firstMeasure.label) {
            console.log(`  ✓ ${type} token already has new format`);
            continue;
          }

          // Old format - array of string IDs, need to convert to array of objects
          const typeConfig = evaluationConfig[type];
          if (typeConfig && typeConfig.fields && typeConfig.fields.measures) {
            const availableMeasures = typeConfig.fields.measures.points || [];

            // Convert measure IDs to full measure point objects
            const newMeasures = enabledEvalFields.measures
              .map(measureId => {
                const measurePoint = availableMeasures.find(m => m.id === measureId);
                return measurePoint || null;
              })
              .filter(m => m !== null);

            // Update the token
            await tokenRef.update({
              'enabledEvaluationFields.measures': newMeasures
            });

            console.log(`  ✅ Updated ${type} token: ${enabledEvalFields.measures.length} measures converted to new format`);
            updatedTokens++;
          } else {
            console.log(`  ⚠️  No measures config found for ${type}`);
          }
        } else {
          console.log(`  ✓ ${type} token measures field is empty or already migrated`);
        }
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - Users processed: ${totalUsers}`);
    console.log(`   - Tokens updated: ${updatedTokens}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migration
migrateEvaluationLabels();
