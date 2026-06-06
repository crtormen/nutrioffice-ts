/**
 * Test calibrated results against historical data
 * This simulates what the new calibrated predictions would have been
 */

import * as fs from "fs";

interface TestResult {
  manualBodyFat: number;
  aiBodyFat: number;
  error: number;
}

function applyCalibratedBodyFat(rawBodyFat: number): number {
  let calibrated = rawBodyFat;

  // Apply range-specific corrections (piecewise)
  if (rawBodyFat < 20) {
    const avgOverestimate = 6.0;
    calibrated = rawBodyFat - avgOverestimate * 0.4;
  } else if (rawBodyFat >= 20 && rawBodyFat < 25) {
    calibrated = rawBodyFat - 0.2;
  } else if (rawBodyFat >= 25 && rawBodyFat < 30) {
    calibrated = rawBodyFat + 1.0;
  } else if (rawBodyFat >= 30 && rawBodyFat < 35) {
    calibrated = rawBodyFat + 0.5;
  } else if (rawBodyFat >= 35) {
    const underestimate = 10.0;
    const scaleFactor = Math.min(1.0, (rawBodyFat - 30) / 10);
    calibrated = rawBodyFat + underestimate * scaleFactor;
  }

  calibrated = Math.max(5, Math.min(60, calibrated));
  return Math.round(calibrated * 10) / 10;
}

function testCalibratedResults(resultsFile: string) {
  console.log("=== Testing Calibrated Results ===\n");

  // Read JSON file
  const data = JSON.parse(fs.readFileSync(resultsFile, "utf-8"));
  const results: TestResult[] = data.results;

  console.log(`Total tests: ${results.length}\n`);

  // Apply calibration to each result
  const calibratedResults = results.map((r) => {
    const rawAI = r.aiBodyFat;
    const calibratedAI = applyCalibratedBodyFat(rawAI);
    const newError = calibratedAI - r.manualBodyFat;

    return {
      manual: r.manualBodyFat,
      rawAI,
      calibratedAI,
      oldError: r.error,
      newError,
      improvement: Math.abs(r.error) - Math.abs(newError),
    };
  });

  // Calculate metrics
  const squaredErrors = calibratedResults.map((r) => r.newError * r.newError);
  const absErrors = calibratedResults.map((r) => Math.abs(r.newError));

  const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length);
  const mae = absErrors.reduce((a, b) => a + b, 0) / absErrors.length;

  const within3 = calibratedResults.filter((r) => Math.abs(r.newError) <= 3).length;
  const within5 = calibratedResults.filter((r) => Math.abs(r.newError) <= 5).length;

  // R-squared
  const manualValues = calibratedResults.map((r) => r.manual);
  const manualMean = manualValues.reduce((a, b) => a + b, 0) / manualValues.length;
  const ssTot = manualValues.reduce((sum, v) => sum + Math.pow(v - manualMean, 2), 0);
  const ssRes = squaredErrors.reduce((sum, e) => sum + e, 0);
  const rSquared = 1 - ssRes / ssTot;

  console.log("=== Calibrated Accuracy Metrics ===\n");
  console.log(`RMSE: ${rmse.toFixed(2)}% (was: ${data.metrics.rmse.toFixed(2)}%)`);
  console.log(`MAE: ${mae.toFixed(2)}% (was: ${data.metrics.mae.toFixed(2)}%)`);
  console.log(`R²: ${rSquared.toFixed(3)} (was: ${data.metrics.rSquared.toFixed(3)})`);
  console.log(`Within ±3%: ${within3}/${results.length} (${((within3 / results.length) * 100).toFixed(1)}%) - was: ${data.metrics.percentWithinThreshold}%`);
  console.log(`Within ±5%: ${within5}/${results.length} (${((within5 / results.length) * 100).toFixed(1)}%)`);

  console.log("\n=== Target Thresholds ===");
  console.log(`RMSE < 5%: ${rmse < 5 ? "✓ PASS" : "❌ FAIL"} (${rmse.toFixed(2)}%)`);
  console.log(`R² > 0.8: ${rSquared > 0.8 ? "✓ PASS" : "❌ FAIL"} (${rSquared.toFixed(3)})`);
  console.log(`Within ±3% > 80%: ${(within3 / results.length) > 0.8 ? "✓ PASS" : "❌ FAIL"} (${((within3 / results.length) * 100).toFixed(1)}%)`);

  // Show examples
  console.log("\n=== Example Corrections ===\n");
  console.log("Manual".padEnd(10) + "Raw AI".padEnd(10) + "Calibrated".padEnd(12) + "Old Error".padEnd(12) + "New Error".padEnd(12) + "Better?");
  console.log("-".repeat(68));

  // Show 10 random examples
  const samples = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45].map((i) => calibratedResults[i]).filter((r) => r);
  for (const r of samples) {
    const better = Math.abs(r.newError) < Math.abs(r.oldError) ? "✓" : "✗";
    console.log(
      r.manual.toFixed(1).padEnd(10) +
      r.rawAI.toFixed(1).padEnd(10) +
      r.calibratedAI.toFixed(1).padEnd(12) +
      r.oldError.toFixed(1).padEnd(12) +
      r.newError.toFixed(1).padEnd(12) +
      better
    );
  }

  // Count improvements
  const improved = calibratedResults.filter((r) => r.improvement > 0).length;
  const worsened = calibratedResults.filter((r) => r.improvement < 0).length;
  const same = calibratedResults.filter((r) => r.improvement === 0).length;

  console.log(`\n\n=== Overall Impact ===`);
  console.log(`Improved: ${improved}/${results.length} (${((improved / results.length) * 100).toFixed(1)}%)`);
  console.log(`Worsened: ${worsened}/${results.length} (${((worsened / results.length) * 100).toFixed(1)}%)`);
  console.log(`Same: ${same}/${results.length} (${((same / results.length) * 100).toFixed(1)}%)`);

  const avgImprovement = calibratedResults.reduce((sum, r) => sum + r.improvement, 0) / results.length;
  console.log(`\nAverage error reduction: ${avgImprovement.toFixed(2)}%`);
}

// Run test
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node lib/test/testCalibratedResults.js <results-json-file>");
  console.error("\nExample:");
  console.error("  node lib/test/testCalibratedResults.js accuracy-test-results-1768242975374.json");
  process.exit(1);
}

testCalibratedResults(args[0]);
