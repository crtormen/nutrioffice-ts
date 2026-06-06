/**
 * Analyze error patterns from batch test results
 * This helps identify systematic bias in AI predictions
 */

import * as fs from "fs";

interface TestResult {
  manualBodyFat: number;
  aiBodyFat: number;
  error: number;
}

interface ErrorPattern {
  range: string;
  count: number;
  avgManual: number;
  avgAI: number;
  avgError: number;
  avgAbsError: number;
  minError: number;
  maxError: number;
}

function analyzePattern(resultsFile: string) {
  console.log("=== Error Pattern Analysis ===\n");

  // Read JSON file
  const data = JSON.parse(fs.readFileSync(resultsFile, "utf-8"));
  const results: TestResult[] = data.results;

  // Define BF% ranges
  const ranges = [
    {min: 0, max: 15, label: "Very Low (6-15%)"},
    {min: 15, max: 20, label: "Low (15-20%)"},
    {min: 20, max: 25, label: "Average (20-25%)"},
    {min: 25, max: 30, label: "Above Avg (25-30%)"},
    {min: 30, max: 35, label: "High (30-35%)"},
    {min: 35, max: 50, label: "Very High (35-50%)"},
  ];

  const patterns: ErrorPattern[] = [];

  // Analyze each range
  for (const range of ranges) {
    const rangeResults = results.filter(
      (r) => r.manualBodyFat >= range.min && r.manualBodyFat < range.max
    );

    if (rangeResults.length === 0) continue;

    const avgManual = rangeResults.reduce((sum, r) => sum + r.manualBodyFat, 0) / rangeResults.length;
    const avgAI = rangeResults.reduce((sum, r) => sum + r.aiBodyFat, 0) / rangeResults.length;
    const avgError = rangeResults.reduce((sum, r) => sum + r.error, 0) / rangeResults.length;
    const avgAbsError = rangeResults.reduce((sum, r) => sum + Math.abs(r.error), 0) / rangeResults.length;
    const errors = rangeResults.map((r) => r.error);
    const minError = Math.min(...errors);
    const maxError = Math.max(...errors);

    patterns.push({
      range: range.label,
      count: rangeResults.length,
      avgManual,
      avgAI,
      avgError,
      avgAbsError,
      minError,
      maxError,
    });
  }

  // Display results
  console.log("Range Analysis:\n");
  console.log("Range".padEnd(20) + "Count".padEnd(8) + "Avg Manual".padEnd(13) + "Avg AI".padEnd(10) + "Avg Error".padEnd(12) + "Bias");
  console.log("-".repeat(75));

  for (const p of patterns) {
    const bias = p.avgError > 2 ? "OVERESTIMATE" : p.avgError < -2 ? "UNDERESTIMATE" : "OK";
    console.log(
      p.range.padEnd(20) +
      p.count.toString().padEnd(8) +
      p.avgManual.toFixed(1).padEnd(13) +
      p.avgAI.toFixed(1).padEnd(10) +
      p.avgError.toFixed(1).padEnd(12) +
      bias
    );
  }

  console.log("\nDetailed Statistics by Range:\n");
  for (const p of patterns) {
    console.log(`\n${p.range} (n=${p.count}):`);
    console.log(`  Manual BF%:  ${p.avgManual.toFixed(2)}%`);
    console.log(`  AI BF%:      ${p.avgAI.toFixed(2)}%`);
    console.log(`  Avg Error:   ${p.avgError.toFixed(2)}% (${p.avgError > 0 ? "AI higher" : "AI lower"})`);
    console.log(`  MAE:         ${p.avgAbsError.toFixed(2)}%`);
    console.log(`  Error Range: [${p.minError.toFixed(1)}%, ${p.maxError.toFixed(1)}%]`);
  }

  // Calculate linear regression for calibration
  const x = results.map((r) => r.aiBodyFat);
  const y = results.map((r) => r.manualBodyFat);
  const n = results.length;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  console.log("\n\n=== Calibration Formula ===");
  console.log(`\nLinear regression: Manual = ${slope.toFixed(4)} * AI + ${intercept.toFixed(4)}`);
  console.log("\nExample corrections:");
  for (const testAI of [10, 15, 20, 25, 30, 35, 40]) {
    const calibrated = slope * testAI + intercept;
    console.log(`  AI: ${testAI}% → Calibrated: ${calibrated.toFixed(1)}%`);
  }

  console.log("\n\n=== Recommendation ===");
  if (Math.abs(slope - 1) > 0.1 || Math.abs(intercept) > 2) {
    console.log("✓ Calibration would significantly improve accuracy");
    console.log(`  Apply formula: Manual = ${slope.toFixed(4)} * AI + ${intercept.toFixed(4)}`);
  } else {
    console.log("⚠ Linear calibration may not help significantly");
    console.log("  Consider other approaches (better prompts, different model, etc.)");
  }
}

// Run analysis
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node lib/test/analyzeErrorPattern.js <results-json-file>");
  console.error("\nExample:");
  console.error("  node lib/test/analyzeErrorPattern.js accuracy-test-results-1768242975374.json");
  process.exit(1);
}

analyzePattern(args[0]);
