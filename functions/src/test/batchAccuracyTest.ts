/**
 * Batch Accuracy Test for AI Body Composition Analysis
 *
 * This script tests multiple historical consultas to calculate accuracy metrics:
 * - RMSE (Root Mean Square Error)
 * - MAE (Mean Absolute Error)
 * - R² (Coefficient of Determination)
 *
 * Run with: npm run build && node lib/test/batchAccuracyTest.js <userId>
 */

// Load environment variables from .env file
import dotenv from "dotenv";
import {fileURLToPath} from "url";
import {dirname, join} from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({path: join(__dirname, "../../.env")});

import {BodyVisionAnalysisService} from "../services/BodyVisionAnalysisService.js";
import {db} from "../firebase-admin.js";

interface TestResult {
  consultaId: string;
  customerId: string;
  date: string;
  manualBodyFat: number;
  aiBodyFat: number;
  error: number;
  relativeError: number;
  confidence: number;
  imageQuality: number;
  status: "success" | "failed";
  errorMessage?: string;
}

/**
 * Calculate accuracy metrics
 */
function calculateMetrics(results: TestResult[]) {
  const successResults = results.filter((r) => r.status === "success");

  if (successResults.length === 0) {
    return null;
  }

  // Calculate errors
  const errors = successResults.map((r) => r.error);
  const squaredErrors = errors.map((e) => e * e);
  const absoluteErrors = errors.map((e) => Math.abs(e));

  // RMSE (Root Mean Square Error)
  const mse = squaredErrors.reduce((sum, e) => sum + e, 0) / squaredErrors.length;
  const rmse = Math.sqrt(mse);

  // MAE (Mean Absolute Error)
  const mae = absoluteErrors.reduce((sum, e) => sum + e, 0) / absoluteErrors.length;

  // R² (Coefficient of Determination)
  const manualValues = successResults.map((r) => r.manualBodyFat);
  const manualMean = manualValues.reduce((sum, v) => sum + v, 0) / manualValues.length;

  const ssTot = manualValues.reduce((sum, v) => sum + Math.pow(v - manualMean, 2), 0);
  const ssRes = squaredErrors.reduce((sum, e) => sum + e, 0);
  const rSquared = 1 - ssRes / ssTot;

  // Additional statistics
  const withinThreshold = successResults.filter((r) => Math.abs(r.error) <= 3).length;
  const percentWithinThreshold = (withinThreshold / successResults.length) * 100;

  const avgConfidence = successResults.reduce((sum, r) => sum + r.confidence, 0) / successResults.length;
  const avgImageQuality = successResults.reduce((sum, r) => sum + r.imageQuality, 0) / successResults.length;

  return {
    rmse,
    mae,
    rSquared,
    withinThreshold,
    percentWithinThreshold,
    avgConfidence,
    avgImageQuality,
    totalTests: results.length,
    successfulTests: successResults.length,
    failedTests: results.length - successResults.length,
  };
}

/**
 * Find consultas with images and manual measurements
 */
async function findTestConsultas(userId: string, limit = 50) {
  console.log(`Searching for consultas with images and manual measurements...`);
  console.log(`User: ${userId}`);
  console.log(`Limit: ${limit}\n`);

  const customersSnapshot = await db
    .collection("users")
    .doc(userId)
    .collection("customers")
    .get();

  const testConsultas: Array<{
    customerId: string;
    consultaId: string;
    data: any;
  }> = [];

  for (const customerDoc of customersSnapshot.docs) {
    const customerId = customerDoc.id;

    const consultasSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("customers")
      .doc(customerId)
      .collection("consultas")
      .get();

    for (const consultaDoc of consultasSnapshot.docs) {
      const consulta = consultaDoc.data();

      // Check if has images and manual results
      const hasImages =
        consulta?.images?.img_frente &&
        consulta?.images?.img_costas &&
        consulta?.images?.img_lado;

      const bodyFat = consulta?.results?.fat;
      const hasValidResults = bodyFat && bodyFat >= 6 && bodyFat <= 60;

      if (hasImages && hasValidResults) {
        testConsultas.push({
          customerId,
          consultaId: consultaDoc.id,
          data: consulta,
        });

        if (testConsultas.length >= limit) {
          break;
        }
      }
    }

    if (testConsultas.length >= limit) {
      break;
    }
  }

  return testConsultas;
}

/**
 * Run batch accuracy test
 */
async function runBatchTest() {
  console.log("=== Batch Accuracy Test - AI Body Composition ===\n");

  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: node lib/test/batchAccuracyTest.js <userId> [limit]");
    console.error("\nExample:");
    console.error("  node lib/test/batchAccuracyTest.js user123 50");
    console.error("\nParameters:");
    console.error("  userId - Firebase user ID to test");
    console.error("  limit  - Maximum number of consultas to test (default: 50)");
    process.exit(1);
  }

  const userId = args[0];
  const limit = parseInt(args[1]) || 50;

  try {
    // Find test consultas
    const testConsultas = await findTestConsultas(userId, limit);

    console.log(`✓ Found ${testConsultas.length} consultas for testing\n`);

    if (testConsultas.length === 0) {
      console.error("❌ No consultas found with images and manual measurements");
      console.error("\nMake sure your consultas have:");
      console.error("  - images.img_frente, img_costas, img_lado");
      console.error("  - results.fat (manual body fat percentage)");
      process.exit(1);
    }

    // Initialize service
    const service = new BodyVisionAnalysisService();

    // Run tests
    const results: TestResult[] = [];

    for (let i = 0; i < testConsultas.length; i++) {
      const {customerId, consultaId, data: consulta} = testConsultas[i];

      console.log(`\n[${i + 1}/${testConsultas.length}] Testing consulta ${consultaId}...`);

      try {
        // Extract customer data
        const customerDoc = await db
          .collection("users")
          .doc(userId)
          .collection("customers")
          .doc(customerId)
          .get();
        const customer = customerDoc.data();

        // Prepare input
        const testInput = {
          gender: (customer?.gender || consulta?.gender || "M") as "M" | "H",
          age: consulta?.idade || customer?.age || 30,
          weight: parseFloat(consulta?.peso) || 70,
          height: consulta?.structure?.altura || customer?.height || 170,
          images: {
            front: consulta.images.img_frente?.url || consulta.images.img_frente?.downloadURL,
            back: consulta.images.img_costas?.url || consulta.images.img_costas?.downloadURL,
            side: consulta.images.img_lado?.url || consulta.images.img_lado?.downloadURL,
          },
        };

        // Run AI analysis
        const result = await service.analyzeBodyComposition(testInput);

        const manualBodyFat = consulta.results.fat;
        const aiBodyFat = result.results.bodyFatPercentage;
        const error = aiBodyFat - manualBodyFat;
        const relativeError = (Math.abs(error) / manualBodyFat) * 100;

        console.log(`  Manual: ${manualBodyFat}% | AI: ${aiBodyFat}% | Error: ${error.toFixed(2)}%`);
        console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}% | Quality: ${result.imageQuality.overallQuality}/100`);

        results.push({
          consultaId,
          customerId,
          date: consulta.date || "N/A",
          manualBodyFat,
          aiBodyFat,
          error,
          relativeError,
          confidence: result.confidence,
          imageQuality: result.imageQuality.overallQuality,
          status: "success",
        });
      } catch (error: any) {
        console.log(`  ❌ Failed: ${error.message}`);
        results.push({
          consultaId,
          customerId,
          date: consulta.date || "N/A",
          manualBodyFat: consulta.results.fat,
          aiBodyFat: 0,
          error: 0,
          relativeError: 0,
          confidence: 0,
          imageQuality: 0,
          status: "failed",
          errorMessage: error.message,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Calculate metrics
    console.log("\n\n=== Accuracy Metrics ===\n");

    const metrics = calculateMetrics(results);

    if (!metrics) {
      console.error("❌ No successful tests to calculate metrics");
      process.exit(1);
    }

    console.log(`Tests: ${metrics.successfulTests}/${metrics.totalTests} successful`);
    console.log(`Failed: ${metrics.failedTests}\n`);

    console.log("Body Fat Percentage Accuracy:");
    console.log(`- RMSE: ${metrics.rmse.toFixed(2)}%`);
    console.log(`- MAE: ${metrics.mae.toFixed(2)}%`);
    console.log(`- R²: ${metrics.rSquared.toFixed(3)}`);
    console.log(`- Within ±3%: ${metrics.withinThreshold}/${metrics.successfulTests} (${metrics.percentWithinThreshold.toFixed(1)}%)`);
    console.log();

    console.log("Average Metrics:");
    console.log(`- Confidence: ${(metrics.avgConfidence * 100).toFixed(1)}%`);
    console.log(`- Image Quality: ${metrics.avgImageQuality.toFixed(1)}/100`);
    console.log();

    console.log("=== Target Thresholds (Phase 1 Goals) ===");
    console.log(`RMSE < 5%: ${metrics.rmse < 5 ? "✓ PASS" : "❌ FAIL"} (${metrics.rmse.toFixed(2)}%)`);
    console.log(`R² > 0.8: ${metrics.rSquared > 0.8 ? "✓ PASS" : "❌ FAIL"} (${metrics.rSquared.toFixed(3)})`);
    console.log(`Within ±3% > 80%: ${metrics.percentWithinThreshold > 80 ? "✓ PASS" : "❌ FAIL"} (${metrics.percentWithinThreshold.toFixed(1)}%)`);
    console.log();

    // Export results to JSON
    const outputFile = `accuracy-test-results-${Date.now()}.json`;
    const fs = await import("fs");
    fs.writeFileSync(
      outputFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          userId,
          metrics,
          results,
        },
        null,
        2
      )
    );

    console.log(`✓ Results saved to: ${outputFile}`);
    console.log("\n=== Batch Test Completed ===");

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Batch test failed:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run batch test
runBatchTest();
