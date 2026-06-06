/**
 * Test script for Body Vision Analysis with Historical Data
 *
 * This script fetches real consultas from Firestore and tests AI analysis accuracy.
 * Run with: npm run build && node lib/test/testWithHistoricalData.js <userId> <customerId> <consultaId>
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

/**
 * Fetch consulta from Firestore
 */
async function fetchConsulta(userId: string, customerId: string, consultaId: string) {
  const consultaRef = db
    .collection("users")
    .doc(userId)
    .collection("customers")
    .doc(customerId)
    .collection("consultas")
    .doc(consultaId);

  const consultaDoc = await consultaRef.get();

  if (!consultaDoc.exists) {
    throw new Error(`Consulta not found: ${consultaId}`);
  }

  return consultaDoc.data();
}

/**
 * Test analysis with historical consulta
 */
async function testWithHistoricalData() {
  console.log("=== Body Vision Analysis - Historical Data Test ===\n");

  // Verify environment variables are loaded
  console.log("Environment Check:");
  console.log(`- GOOGLE_CLOUD_PROJECT_ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID || "NOT SET"}`);
  console.log();

  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Usage: node lib/test/testWithHistoricalData.js <userId> <customerId> <consultaId>");
    console.error("\nExample:");
    console.error("  node lib/test/testWithHistoricalData.js user123 customer456 consulta789");
    console.error("\nTo find these IDs:");
    console.error("  1. Go to Firebase Console → Firestore");
    console.error("  2. Navigate to: users/{userId}/customers/{customerId}/consultas/{consultaId}");
    console.error("  3. Make sure the consulta has images.img_frente, img_costas, img_lado");
    process.exit(1);
  }

  const [userId, customerId, consultaId] = args;

  try {
    // Fetch consulta from Firestore
    console.log("Fetching consulta from Firestore...");
    console.log(`- User: ${userId}`);
    console.log(`- Customer: ${customerId}`);
    console.log(`- Consulta: ${consultaId}`);
    console.log();

    const consulta = await fetchConsulta(userId, customerId, consultaId);

    // Extract customer data
    const customerRef = db
      .collection("users")
      .doc(userId)
      .collection("customers")
      .doc(customerId);
    const customerDoc = await customerRef.get();
    const customer = customerDoc.data();

    console.log("✓ Consulta fetched");
    console.log(`- Date: ${consulta?.date || "N/A"}`);
    console.log(`- Weight: ${consulta?.peso || "N/A"} kg`);
    console.log(`- Online: ${consulta?.online ? "Yes" : "No"}`);
    console.log();

    // Check if images exist
    const images = consulta?.images;
    if (!images || !images.img_frente || !images.img_costas || !images.img_lado) {
      console.error("❌ ERROR: Consulta is missing required images");
      console.error("Required: img_frente, img_costas, img_lado");
      console.error("Found:", Object.keys(images || {}));
      process.exit(1);
    }

    // Extract image URLs
    const frontUrl = images.img_frente?.url || images.img_frente?.downloadURL;
    const backUrl = images.img_costas?.url || images.img_costas?.downloadURL;
    const sideUrl = images.img_lado?.url || images.img_lado?.downloadURL;

    if (!frontUrl || !backUrl || !sideUrl) {
      console.error("❌ ERROR: Image URLs not found");
      console.error("Front URL:", frontUrl);
      console.error("Back URL:", backUrl);
      console.error("Side URL:", sideUrl);
      process.exit(1);
    }

    console.log("Image URLs:");
    console.log(`- Front: ${frontUrl.substring(0, 60)}...`);
    console.log(`- Back: ${backUrl.substring(0, 60)}...`);
    console.log(`- Side: ${sideUrl.substring(0, 60)}...`);
    console.log();

    // Prepare input for AI analysis
    const testInput = {
      gender: (customer?.gender || consulta?.gender || "M") as "M" | "H",
      age: consulta?.idade || customer?.age || 30,
      weight: parseFloat(consulta?.peso) || 70,
      height: consulta?.structure?.altura || customer?.height || 170,
      images: {
        front: frontUrl,
        back: backUrl,
        side: sideUrl,
      },
    };

    console.log("Test Input:");
    console.log(`- Gender: ${testInput.gender === "M" ? "Female" : "Male"}`);
    console.log(`- Age: ${testInput.age} years`);
    console.log(`- Weight: ${testInput.weight} kg`);
    console.log(`- Height: ${testInput.height} cm`);
    console.log();

    // Initialize service and run analysis
    console.log("Initializing BodyVisionAnalysisService...");
    const service = new BodyVisionAnalysisService();
    console.log("✓ Service initialized\n");

    console.log("Starting AI analysis...");
    const startTime = Date.now();

    const result = await service.analyzeBodyComposition(testInput);

    const duration = Date.now() - startTime;
    console.log(`✓ Analysis completed in ${duration}ms\n`);

    // Display results
    console.log("=== AI Analysis Results ===");
    console.log(`Status: ${result.status}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`Needs Review: ${result.needsReview ? "Yes" : "No"}`);
    console.log(`Model: ${result.model}`);
    console.log();

    console.log("Body Composition (AI):");
    console.log(`- Body Fat: ${result.results.bodyFatPercentage}%`);
    console.log(`- Fat Mass: ${result.results.fatMass} kg`);
    console.log(`- Lean Mass: ${result.results.leanMass} kg`);
    console.log(`- Muscle Mass: ${result.results.muscleMass} kg`);
    console.log();

    // Compare with manual measurements (if available)
    if (consulta?.results) {
      console.log("=== Comparison with Manual Measurements ===");
      const manual = consulta.results;
      const ai = result.results;

      console.log("\nBody Fat Percentage:");
      console.log(`- Manual: ${manual.fat}%`);
      console.log(`- AI: ${ai.bodyFatPercentage}%`);
      const fatDiff = Math.abs(manual.fat - ai.bodyFatPercentage);
      console.log(`- Difference: ${fatDiff.toFixed(2)}% (${fatDiff <= 3 ? "✓ Good" : "⚠ High"})`);

      console.log("\nFat Mass:");
      console.log(`- Manual: ${manual.mg} kg`);
      console.log(`- AI: ${ai.fatMass} kg`);
      const fatMassDiff = Math.abs(manual.mg - ai.fatMass);
      console.log(`- Difference: ${fatMassDiff.toFixed(2)} kg`);

      console.log("\nLean Mass:");
      console.log(`- Manual: ${manual.mm} kg`);
      console.log(`- AI: ${ai.leanMass} kg`);
      const leanMassDiff = Math.abs(manual.mm - ai.leanMass);
      console.log(`- Difference: ${leanMassDiff.toFixed(2)} kg`);

      // Calculate accuracy metrics
      const relativeError = (fatDiff / manual.fat) * 100;
      console.log("\n=== Accuracy Metrics ===");
      console.log(`Relative Error (Body Fat): ${relativeError.toFixed(2)}%`);
      console.log(`Target: < 10% relative error`);
      console.log(`Status: ${relativeError < 10 ? "✓ PASS" : "❌ FAIL"}`);
    }

    // Image quality
    console.log("\n=== Image Quality Assessment ===");
    console.log(`- Front: ${result.imageQuality.front}/100`);
    console.log(`- Back: ${result.imageQuality.back}/100`);
    console.log(`- Side: ${result.imageQuality.side}/100`);
    console.log(`- Overall: ${result.imageQuality.overallQuality}/100`);

    // Anomalies
    if (result.anomalies.length > 0) {
      console.log("\n⚠ Anomalies Detected:");
      for (const anomaly of result.anomalies) {
        console.log(`- [${anomaly.type}] ${anomaly.message}`);
      }
    }

    // Analysis notes
    if (result.results.postureNotes) {
      console.log("\n=== AI Analysis Notes ===");
      console.log(result.results.postureNotes);
    }

    console.log("\n=== Test Completed Successfully ===");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Test failed:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run test
testWithHistoricalData();
