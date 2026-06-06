/**
 * Body Vision Analysis Service
 *
 * AI-powered body composition analysis using Google Vertex AI Gemini 2.0 Flash.
 * Analyzes 3-angle photos (front, back, side) to estimate body composition
 * when manual caliper measurements are not available (online consultations).
 */

import {VertexAI} from "@google-cloud/vertexai";
import {IBodyCompositionResults} from "./BodyCompositionService.js";
import {storage} from "../firebase-admin.js";
import * as logger from "firebase-functions/logger";
import {fileURLToPath} from "url";
import {dirname, join} from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Input for AI body analysis
 */
export interface IAIBodyAnalysisInput {
  gender: "M" | "H";
  age: number;
  weight: number; // kg
  height: number; // cm
  images: {
    front: string; // Firebase Storage URL or base64
    back: string;
    side: string;
  };
}

/**
 * Quality assessment for uploaded images
 */
export interface IImageQuality {
  front: number; // 0-100
  back: number; // 0-100
  side: number; // 0-100
  overallQuality: number; // 0-100
}

/**
 * Anomaly detected during analysis
 */
export interface IAIAnalysisAnomaly {
  type: "large_change" | "low_confidence" | "inconsistent_view" | "poor_quality";
  field: string;
  value?: number;
  delta?: number;
  message: string;
}

/**
 * Raw response from Gemini Vision API
 */
interface IGeminiVisionResponse {
  bodyFatPercentage: number;
  confidenceScore: number; // 0-1
  imageQuality: IImageQuality;
  estimatedCircumferences: {
    waist?: number;
    chest?: number;
    hips?: number;
    abdomen?: number;
  };
  bodyType: "ectomorph" | "mesomorph" | "endomorph" | "mixed";
  analysisNotes: string;
  qualityIssues: string[];
  recommendationsForBetterPhotos: string[];
}

/**
 * Complete AI analysis result
 */
export interface IAIBodyAnalysisResult {
  status: "completed" | "failed" | "needs_review";
  confidence: number; // 0-1 (final adjusted confidence)
  needsReview: boolean;
  results: IBodyCompositionResults & {
    estimatedCircumferences?: {
      waist?: number;
      chest?: number;
      hips?: number;
      abdomen?: number;
    };
    bodyType?: "ectomorph" | "mesomorph" | "endomorph" | "mixed";
    postureNotes?: string;
  };
  imageQuality: IImageQuality;
  anomalies: IAIAnalysisAnomaly[];
  rawResponse?: IGeminiVisionResponse;
  errorMessage?: string;
  processingTimeMs: number;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  costUSD?: number;
}

/**
 * Body Vision Analysis Service
 */
export class BodyVisionAnalysisService {
  private vertexAI: VertexAI;
  private model: any;
  private projectId: string | undefined;

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.VITE_GOOGLE_CLOUD_PROJECT_ID;

    if (!this.projectId) {
      throw new Error("GOOGLE_CLOUD_PROJECT_ID environment variable is required");
    }

    // Set Google Application Credentials if not already set
    // This points to the service account file used by Firebase Admin
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const serviceAccountPath = join(__dirname, "../serviceAccount.json");
      process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountPath;
      logger.info(`Set GOOGLE_APPLICATION_CREDENTIALS to: ${serviceAccountPath}`);
    }

    // Initialize Vertex AI client
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: "us-central1", // Use us-central1 for best availability
    });

    // Initialize Gemini 2.0 Flash model
    this.model = this.vertexAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1, // Low temperature for consistency
        maxOutputTokens: 2048,
        responseMimeType: "application/json", // Force JSON output
      },
    });
  }

  /**
   * Main analysis entry point
   * Analyzes 3-angle photos to estimate body composition
   */
  async analyzeBodyComposition(
    input: IAIBodyAnalysisInput
  ): Promise<IAIBodyAnalysisResult> {
    const startTime = Date.now();

    try {
      // Build the analysis prompt
      const prompt = this.buildAnalysisPrompt(input);

      // Prepare image data for API call
      const imageParts = await this.prepareImageParts(input.images);

      // Call Gemini Vision API
      const rawResponse = await this.callGeminiVisionAPI(prompt, imageParts);

      // Apply statistical calibration to body fat estimate
      const calibratedBodyFat = this.applyCalibratedBodyFat(rawResponse.bodyFatPercentage);
      rawResponse.bodyFatPercentage = calibratedBodyFat;

      // Calculate final confidence score
      const finalConfidence = this.calculateFinalConfidence(
        rawResponse.confidenceScore,
        rawResponse.imageQuality
      );

      // Detect anomalies
      const anomalies = this.detectAnomalies(rawResponse);

      // Convert to body composition results format
      const results = this.convertToBodyCompositionResults(input, rawResponse);

      // Determine if needs review
      const needsReview = finalConfidence < 0.7 || anomalies.length > 0 ||
        rawResponse.imageQuality.overallQuality < 70;

      const processingTimeMs = Date.now() - startTime;

      return {
        status: "completed",
        confidence: finalConfidence,
        needsReview,
        results,
        imageQuality: rawResponse.imageQuality,
        anomalies,
        rawResponse,
        processingTimeMs,
        model: "gemini-2.0-flash-exp",
        // Token and cost data would come from API metadata (not available in response body)
        // These would need to be extracted from API response headers/metadata
      };
    } catch (error: any) {
      const processingTimeMs = Date.now() - startTime;

      return {
        status: "failed",
        confidence: 0,
        needsReview: true,
        results: this.getEmptyResults(input),
        imageQuality: {front: 0, back: 0, side: 0, overallQuality: 0},
        anomalies: [],
        errorMessage: error?.message || "Unknown error during AI analysis",
        processingTimeMs,
        model: "gemini-2.0-flash-exp",
      };
    }
  }

  /**
   * Build the analysis prompt for Gemini
   */
  private buildAnalysisPrompt(input: IAIBodyAnalysisInput): string {
    const {gender, age, weight, height} = input;

    // Calculate BMI as additional reference
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    return `
You are an expert anthropometrist analyzing body composition from standardized photos.

CONTEXT:
- Gender: ${gender === "M" ? "Female" : "Male"}
- Age: ${age} years
- Weight: ${weight} kg
- Height: ${height} cm
- BMI: ${bmi.toFixed(1)}

IMAGES PROVIDED:
1. Front view (anatomical position)
2. Back view (anatomical position)
3. Side view (lateral profile)

TASK:
Analyze these images to estimate body composition with the following methodology:

1. **Visual Cues Analysis**:
   - Subcutaneous fat distribution (trunk, limbs, face)
   - Muscle definition and tone
   - Body proportions and frame size
   - Posture and skeletal landmarks

2. **Anthropometric Estimation**:
   - Estimate key circumferences: waist, chest, hips, abdomen (in cm)
   - Use these measurements to cross-validate your body fat estimate
   - Estimate body density based on visual fat distribution
   - Consider age and gender-specific fat patterns

   **BMI Cross-Reference** (BMI: ${bmi.toFixed(1)}):
   ${gender === "M" ? `
   - BMI 18-20: Usually 15-22% BF (very fit to fit)
   - BMI 21-24: Usually 20-28% BF (average to slightly above)
   - BMI 25-29: Usually 28-35% BF (above average to high)
   - BMI 30-35: Usually 35-42% BF (high to very high)
   - BMI 36+: Usually 40-50% BF (very high to extremely high)
   ` : `
   - BMI 18-20: Usually 8-15% BF (lean to fit)
   - BMI 21-24: Usually 14-20% BF (average to slightly above)
   - BMI 25-29: Usually 20-28% BF (above average to high)
   - BMI 30-35: Usually 28-38% BF (high to very high)
   - BMI 36+: Usually 35-45% BF (very high to extremely high)
   `}
   Note: These are rough correlations. Muscular individuals will have lower BF% for their BMI.

3. **Body Fat Percentage Estimation**:
   - Use visual cues similar to skinfold caliper methodology
   - Account for subcutaneous vs. visceral fat distribution
   - Reference Jackson-Pollock prediction equations conceptually

   **Visual Reference Ranges for ${gender === "M" ? "FEMALE" : "MALE"}:**
   ${gender === "M" ? `
   - 10-13%: Athletic, visible abs, very lean arms/legs, minimal subcutaneous fat, defined jawline
   - 14-20%: Fit, some ab definition, lean limbs, slight fat on hips/thighs, clear jawline
   - 21-24%: Average, no ab definition, soft abdomen, moderate fat on hips/thighs/arms, normal face
   - 25-31%: Above average, rounded abdomen, significant fat on thighs/arms, softer face, waist > 80cm
   - 32-37%: High, protruding abdomen, thick arms/thighs, double chin starting, waist > 90cm
   - 38-42%: Very high, significantly protruding abdomen, very thick limbs, clear double chin, waist > 100cm
   - 43-50%: Extremely high, large overhanging abdomen, extremely thick limbs, significant neck/face fullness
   ` : `
   - 2-5%: Extremely lean, visible striations, highly vascular, ribs visible, shredded appearance
   - 6-13%: Athletic/lean, visible abs (6-pack), defined arms/chest, minimal fat, clear muscle separation
   - 14-17%: Fit, abs visible but not defined, lean limbs, slight fat on waist, healthy appearance
   - 18-24%: Average, no visible abs, soft midsection, moderate fat on waist/chest, normal face
   - 25-30%: Above average, rounded belly, fuller chest, fat on waist/love handles, softer face, waist > 90cm
   - 31-37%: High, protruding belly, thick chest/back, significant love handles, waist > 100cm
   - 38-45%: Very high, large protruding belly, very thick torso, double chin, waist > 110cm
   - 46-50%: Extremely high, massive abdominal protrusion, very large frame, significant fullness everywhere
   `}

   **Critical Visual Markers:**
   - Abdominal definition vs. softness/protrusion
   - Jawline definition vs. facial fullness/double chin
   - Arm/leg muscle definition vs. subcutaneous fat coverage
   - Waist-to-hip ratio and fat distribution patterns
   - Visible vascularity (low BF%) vs. smooth skin (higher BF%)

4. **Quality Assessment**:
   - Rate image quality (lighting, focus, positioning): 0-100
   - Note any factors limiting accuracy
   - Identify if photos meet analysis standards

OUTPUT FORMAT (strict JSON):
{
  "bodyFatPercentage": <number 5-50>,
  "confidenceScore": <number 0-1>,
  "imageQuality": {
    "front": <number 0-100>,
    "back": <number 0-100>,
    "side": <number 0-100>,
    "overallQuality": <number 0-100>
  },
  "estimatedCircumferences": {
    "waist": <number cm>,
    "chest": <number cm>,
    "hips": <number cm>,
    "abdomen": <number cm>
  },
  "bodyType": <"ectomorph" | "mesomorph" | "endomorph" | "mixed">,
  "analysisNotes": <string explaining visible cues>,
  "qualityIssues": [<array of strings, empty if none>],
  "recommendationsForBetterPhotos": [<array of strings>]
}

IMPORTANT:
- Analyze carefully using the visual reference ranges above
- Your estimate should match the visible physical characteristics described in the ranges
- Use a multi-step approach:
  1. Start with BMI cross-reference to get initial range
  2. Examine visual markers (abs, face, limbs, overall definition)
  3. Estimate circumferences and validate consistency
  4. Arrive at final estimate that matches BOTH visual appearance AND BMI range
- Be accurate across the full range:
  * For lean individuals (visible abs, defined limbs): estimate 10-20% (F) or 6-15% (M)
  * For average build (soft abdomen, moderate limbs): estimate 21-31% (F) or 16-25% (M)
  * For higher body fat (protruding abdomen, thick limbs, double chin): estimate 32-45% (F) or 26-38% (M)
  * Trust what you see - if visual markers clearly indicate higher BF%, estimate accordingly
- BMI provides important quantitative context - use it to validate your visual assessment
- Confidence score should reflect:
  * 0.9-1.0: Excellent photos, clear visual markers, consistent across all views
  * 0.7-0.89: Good photos, most markers visible, minor quality issues
  * 0.5-0.69: Acceptable photos, some markers unclear, moderate quality issues
  * <0.5: Poor photos, unclear markers, significant quality/positioning issues
- Consider genetic/ethnic variations in fat distribution
- DO NOT make medical diagnoses
- Focus on subcutaneous fat visible in photos
- Return ONLY valid JSON, no additional text
`;
  }

  /**
   * Prepare image parts for Gemini API
   * Converts Firebase Storage URLs to base64 or uses existing base64
   */
  private async prepareImageParts(images: {
    front: string;
    back: string;
    side: string;
  }): Promise<any[]> {
    const imageParts = [];

    for (const [view, url] of Object.entries(images)) {
      try {
        let base64Data: string;

        // Check if already base64 or needs fetching
        if (url.startsWith("data:image")) {
          // Extract base64 data from data URL
          base64Data = url.split(",")[1];
        } else if (url.startsWith("gs://") || url.startsWith("https://")) {
          // Firebase Storage URL - fetch and convert to base64
          base64Data = await this.fetchImageAsBase64(url);
        } else {
          logger.warn(`Invalid image URL format for ${view}: ${url}`);
          continue;
        }

        imageParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        });
      } catch (error: any) {
        logger.error(`Failed to prepare image ${view}:`, error);
        // Continue with other images even if one fails
      }
    }

    if (imageParts.length === 0) {
      throw new Error("No valid images could be prepared for analysis");
    }

    return imageParts;
  }

  /**
   * Fetch image from Firebase Storage and convert to base64
   */
  private async fetchImageAsBase64(url: string): Promise<string> {
    let bucketName: string;
    let filePath: string;

    // Parse Firebase Storage URL
    if (url.startsWith("gs://")) {
      // Format: gs://bucket-name/path/to/file
      const match = url.match(/^gs:\/\/([^/]+)\/(.+)$/);
      if (!match) {
        throw new Error(`Invalid gs:// URL format: ${url}`);
      }
      bucketName = match[1];
      filePath = match[2];
    } else if (url.includes("firebasestorage.googleapis.com")) {
      // Format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?...
      const match = url.match(/\/b\/([^/]+)\/o\/([^?]+)/);
      if (!match) {
        throw new Error(`Invalid Firebase Storage URL format: ${url}`);
      }
      bucketName = match[1];
      filePath = decodeURIComponent(match[2]);
    } else {
      throw new Error(`Unsupported URL format: ${url}`);
    }

    // Use Firebase Admin Storage with authentication
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    // Download file as buffer
    const [buffer] = await file.download();

    // Convert buffer to base64
    return buffer.toString("base64");
  }

  /**
   * Apply statistical calibration to body fat percentage
   * Uses piecewise correction based on range-specific bias patterns
   *
   * Observed bias from 50-sample test:
   * - Very Low (6-15%): AI overestimates by +7.3%
   * - Low (15-20%): AI overestimates by +4.6%
   * - Average (20-25%): Very accurate (+0.4%)
   * - Above Avg (25-30%): Slight underestimate (-1.9%)
   * - High (30-35%): Accurate (-0.9%)
   * - Very High (35-50%): Massive underestimate (-10.0%)
   */
  private applyCalibratedBodyFat(rawBodyFat: number): number {
    let calibrated = rawBodyFat;

    // Apply range-specific corrections
    if (rawBodyFat < 20) {
      // AI overestimates low BF%
      // Apply correction: subtract ~40% of the overestimation
      const avgOverestimate = 6.0; // Average of 7.3% and 4.6%
      calibrated = rawBodyFat - avgOverestimate * 0.4;
    } else if (rawBodyFat >= 20 && rawBodyFat < 25) {
      // Very accurate in this range - minimal correction
      calibrated = rawBodyFat - 0.2;
    } else if (rawBodyFat >= 25 && rawBodyFat < 30) {
      // Slight underestimate - add small correction
      calibrated = rawBodyFat + 1.0;
    } else if (rawBodyFat >= 30 && rawBodyFat < 35) {
      // Accurate - minimal correction
      calibrated = rawBodyFat + 0.5;
    } else if (rawBodyFat >= 35) {
      // Massive underestimate for high BF%
      // Apply progressive correction: more aggressive as BF% increases
      const underestimate = 10.0;
      const scaleFactor = Math.min(1.0, (rawBodyFat - 30) / 10); // 0 at 30%, 1.0 at 40%+
      calibrated = rawBodyFat + underestimate * scaleFactor;
    }

    // Clamp to reasonable range
    calibrated = Math.max(5, Math.min(60, calibrated));

    // Round to 1 decimal place
    return Math.round(calibrated * 10) / 10;
  }

  /**
   * Call Gemini Vision API with prompt and images
   */
  private async callGeminiVisionAPI(
    prompt: string,
    imageParts: any[]
  ): Promise<IGeminiVisionResponse> {
    try {
      // Combine prompt and images in correct Vertex AI format
      const request = {
        contents: [{
          role: "user",
          parts: [
            {text: prompt},
            ...imageParts,
          ],
        }],
      };

      // Make API call
      const result = await this.model.generateContent(request);

      // Extract response text from candidates
      const response = result.response;

      // Get text from first candidate
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No response candidates returned from Gemini API");
      }

      const candidate = response.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error("No content parts in response candidate");
      }

      const text = candidate.content.parts[0].text;

      // Parse JSON response
      const parsed = JSON.parse(text);

      return parsed as IGeminiVisionResponse;
    } catch (error: any) {
      console.error("Gemini API call failed:", error);
      throw new Error(`Gemini API error: ${error?.message || "Unknown error"}`);
    }
  }

  /**
   * Calculate final confidence score
   * Adjusts AI confidence based on image quality and other factors
   */
  private calculateFinalConfidence(
    aiConfidence: number,
    imageQuality: IImageQuality
  ): number {
    let confidence = aiConfidence;

    // Penalize poor image quality
    if (imageQuality.overallQuality < 70) {
      confidence *= 0.7;
    } else if (imageQuality.overallQuality < 80) {
      confidence *= 0.85;
    }

    // Ensure confidence is between 0 and 1
    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * Detect anomalies in AI analysis
   */
  private detectAnomalies(response: IGeminiVisionResponse): IAIAnalysisAnomaly[] {
    const anomalies: IAIAnalysisAnomaly[] = [];

    // Low confidence anomaly
    if (response.confidenceScore < 0.7) {
      anomalies.push({
        type: "low_confidence",
        field: "overall",
        value: response.confidenceScore,
        message: `AI confidence is low (${(response.confidenceScore * 100).toFixed(0)}%)`,
      });
    }

    // Poor image quality
    if (response.imageQuality.overallQuality < 70) {
      anomalies.push({
        type: "poor_quality",
        field: "images",
        value: response.imageQuality.overallQuality,
        message: `Image quality is poor (${response.imageQuality.overallQuality}/100)`,
      });
    }

    // Check for quality issues reported by AI
    if (response.qualityIssues && response.qualityIssues.length > 0) {
      for (const issue of response.qualityIssues) {
        anomalies.push({
          type: "poor_quality",
          field: "images",
          message: issue,
        });
      }
    }

    return anomalies;
  }

  /**
   * Convert Gemini response to IBodyCompositionResults format
   */
  private convertToBodyCompositionResults(
    input: IAIBodyAnalysisInput,
    response: IGeminiVisionResponse
  ): IAIBodyAnalysisResult["results"] {
    const {weight} = input;
    const {bodyFatPercentage} = response;

    // Calculate component masses based on AI estimate
    const fatMass = this.round((weight * bodyFatPercentage) / 100, 2);
    const leanMass = this.round(weight - fatMass, 2);

    // Calculate bone mass (simplified Rocha formula)
    const boneMass = this.calculateBoneMass(input.height, weight, input.gender);

    // Calculate residual mass
    const residualMass = this.calculateResidualMass(weight, input.gender);

    // Calculate muscle mass
    const muscleMass = this.round(leanMass - boneMass - residualMass, 2);

    return {
      bodyFatPercentage: this.round(bodyFatPercentage, 2),
      fatMass,
      leanMass,
      muscleMass,
      boneMass,
      residualMass,
      formula: "AI_VISION_GEMINI",
      estimatedCircumferences: response.estimatedCircumferences,
      bodyType: response.bodyType,
      postureNotes: response.analysisNotes,
    };
  }

  /**
   * Get empty results for error cases
   */
  private getEmptyResults(input: IAIBodyAnalysisInput): IAIBodyAnalysisResult["results"] {
    return {
      bodyFatPercentage: 0,
      fatMass: 0,
      leanMass: input.weight,
      muscleMass: 0,
      boneMass: 0,
      residualMass: 0,
      formula: "AI_VISION_GEMINI_FAILED",
    };
  }

  /**
   * Calculate bone mass using simplified Rocha formula
   */
  private calculateBoneMass(height: number, weight: number, gender: "M" | "H"): number {
    let boneMass: number;

    if (gender === "H") {
      boneMass = 0.0326 * weight + 0.0000267 * height - 0.0484;
    } else {
      boneMass = 0.0235 * weight + 0.0000267 * height - 0.0415;
    }

    return this.round(boneMass, 2);
  }

  /**
   * Calculate residual mass
   */
  private calculateResidualMass(weight: number, gender: "M" | "H"): number {
    const percentage = gender === "H" ? 0.241 : 0.209;
    return this.round(weight * percentage, 2);
  }

  /**
   * Round to specified decimal places
   */
  private round(value: number, decimals: number): number {
    return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals);
  }
}
