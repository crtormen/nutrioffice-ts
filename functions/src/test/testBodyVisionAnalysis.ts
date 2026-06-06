/**
 * Test script for Body Vision Analysis Service
 *
 * This script validates the AI body composition analysis integration.
 * Run with: npm run build && node lib/test/testBodyVisionAnalysis.js
 */

// Load environment variables from .env file
import dotenv from "dotenv";
import {fileURLToPath} from "url";
import {dirname, join} from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({path: join(__dirname, "../../.env")});

import {BodyVisionAnalysisService} from "../services/BodyVisionAnalysisService.js";

/**
 * Test with sample data
 */
async function testAnalysis() {
  console.log("=== Body Vision Analysis Test ===\n");

  try {
    // Initialize service
    console.log("Initializing BodyVisionAnalysisService...");
    const service = new BodyVisionAnalysisService();
    console.log("✓ Service initialized\n");

    // Sample test data (replace with real Firebase Storage URLs for actual testing)
    const testInput = {
      gender: "M" as const,
      age: 30,
      weight: 80, // kg
      height: 175, // cm
      images: {
        // These should be replaced with actual Firebase Storage URLs
        // Format: gs://nutri-office.appspot.com/images/userId/customerId/consultaId/img_frente.jpg
        // Or: https://firebasestorage.googleapis.com/v0/b/nutri-office.appspot.com/o/...
        front: "REPLACE_WITH_ACTUAL_FRONT_IMAGE_URL",
        back: "REPLACE_WITH_ACTUAL_BACK_IMAGE_URL",
        side: "REPLACE_WITH_ACTUAL_SIDE_IMAGE_URL",
      },
    };

    console.log("Test Input:");
    console.log(`- Gender: ${testInput.gender === "M" ? "Male" : "Female"}`);
    console.log(`- Age: ${testInput.age} years`);
    console.log(`- Weight: ${testInput.weight} kg`);
    console.log(`- Height: ${testInput.height} cm`);
    console.log(`- Front Image: ${testInput.images.front.substring(0, 50)}...`);
    console.log(`- Back Image: ${testInput.images.back.substring(0, 50)}...`);
    console.log(`- Side Image: ${testInput.images.side.substring(0, 50)}...`);
    console.log();

    // Check if URLs are placeholders
    if (testInput.images.front.includes("REPLACE_WITH_ACTUAL")) {
      console.error("❌ ERROR: Please replace placeholder URLs with actual Firebase Storage URLs");
      console.log("\nTo get actual image URLs:");
      console.log("1. Go to Firebase Console → Storage");
      console.log("2. Navigate to: images/{userId}/{customerId}/{consultaId}/");
      console.log("3. Copy the download URL or gs:// path for each image");
      console.log("4. Update the testInput.images object in this file");
      process.exit(1);
    }

    // Run analysis
    console.log("Starting AI analysis...");
    const startTime = Date.now();

    const result = await service.analyzeBodyComposition(testInput);

    const duration = Date.now() - startTime;

    console.log(`✓ Analysis completed in ${duration}ms\n`);

    // Display results
    console.log("=== Analysis Results ===");
    console.log(`Status: ${result.status}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`Needs Review: ${result.needsReview ? "Yes" : "No"}`);
    console.log(`Model: ${result.model}`);
    console.log(`Processing Time: ${result.processingTimeMs}ms`);
    console.log();

    // Image quality
    console.log("Image Quality:");
    console.log(`- Front: ${result.imageQuality.front}/100`);
    console.log(`- Back: ${result.imageQuality.back}/100`);
    console.log(`- Side: ${result.imageQuality.side}/100`);
    console.log(`- Overall: ${result.imageQuality.overallQuality}/100`);
    console.log();

    // Body composition results
    console.log("Body Composition:");
    console.log(`- Body Fat: ${result.results.bodyFatPercentage}%`);
    console.log(`- Fat Mass: ${result.results.fatMass} kg`);
    console.log(`- Lean Mass: ${result.results.leanMass} kg`);
    console.log(`- Muscle Mass: ${result.results.muscleMass} kg`);
    console.log(`- Bone Mass: ${result.results.boneMass} kg`);
    console.log(`- Residual Mass: ${result.results.residualMass} kg`);
    console.log(`- Formula: ${result.results.formula}`);
    console.log();

    // Estimated circumferences
    if (result.results.estimatedCircumferences) {
      console.log("Estimated Circumferences:");
      const circ = result.results.estimatedCircumferences;
      if (circ.waist) console.log(`- Waist: ${circ.waist} cm`);
      if (circ.chest) console.log(`- Chest: ${circ.chest} cm`);
      if (circ.hips) console.log(`- Hips: ${circ.hips} cm`);
      if (circ.abdomen) console.log(`- Abdomen: ${circ.abdomen} cm`);
      console.log();
    }

    // Body type
    if (result.results.bodyType) {
      console.log(`Body Type: ${result.results.bodyType}`);
      console.log();
    }

    // Anomalies
    if (result.anomalies.length > 0) {
      console.log("⚠ Anomalies Detected:");
      for (const anomaly of result.anomalies) {
        console.log(`- [${anomaly.type}] ${anomaly.message}`);
      }
      console.log();
    }

    // Analysis notes
    if (result.results.postureNotes) {
      console.log("Analysis Notes:");
      console.log(result.results.postureNotes);
      console.log();
    }

    // Raw response (for debugging)
    if (result.rawResponse) {
      console.log("=== Raw AI Response ===");
      console.log(JSON.stringify(result.rawResponse, null, 2));
      console.log();
    }

    // Error message (if failed)
    if (result.errorMessage) {
      console.log("❌ Error:");
      console.log(result.errorMessage);
      console.log();
    }

    console.log("=== Test Completed Successfully ===");
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
testAnalysis();
