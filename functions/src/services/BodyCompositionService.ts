/**
 * Body Composition Calculation Service
 *
 * Implements standard anthropometric formulas for body composition analysis:
 * - Jackson-Pollock 3 Folds (JP3)
 * - Jackson-Pollock 7 Folds (JP7)
 * - Durnin-Womersley 4 Folds (DW4)
 * - Siri and Brozek equations for body fat percentage
 */

export interface IBodyCompositionInput {
  gender: "M" | "F";
  age: number;
  weight: number; // kg
  height: number; // cm
  folds?: { [foldId: string]: number }; // mm
  protocol?: "jp3" | "jp7" | "dw4";
  densityEquation?: "siri" | "brozek"; // Default: siri
}

export interface IBodyCompositionResults {
  bodyDensity?: number;
  bodyFatPercentage: number;
  fatMass: number; // kg
  leanMass: number; // kg
  muscleMass?: number; // kg
  boneMass?: number; // kg
  residualMass?: number; // kg
  formula: string;
  sumOfFolds?: number; // mm
}

export class BodyCompositionService {
  /**
   * Main calculation entry point
   */
  static calculate(input: IBodyCompositionInput): IBodyCompositionResults {
    const { protocol, gender, age, weight, height, folds, densityEquation = "siri" } = input;

    if (!protocol || !folds) {
      throw new Error("Protocol and folds data are required for calculation");
    }

    let bodyDensity: number;
    let sumOfFolds: number;

    switch (protocol) {
      case "jp3": {
        const jp3Result = this.calculateJP3(gender, age, folds);
        bodyDensity = jp3Result.bodyDensity;
        sumOfFolds = jp3Result.sumOfFolds;
        break;
      }

      case "jp7": {
        const jp7Result = this.calculateJP7(gender, age, folds);
        bodyDensity = jp7Result.bodyDensity;
        sumOfFolds = jp7Result.sumOfFolds;
        break;
      }

      case "dw4": {
        const dw4Result = this.calculateDW4(gender, age, folds);
        bodyDensity = dw4Result.bodyDensity;
        sumOfFolds = dw4Result.sumOfFolds;
        break;
      }

      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }

    // Convert body density to body fat percentage
    const bodyFatPercentage = this.bodyDensityToFatPercentage(bodyDensity, densityEquation);

    // Calculate component masses
    const fatMass = this.round((weight * bodyFatPercentage) / 100, 2);
    const leanMass = this.round(weight - fatMass, 2);

    // Calculate bone mass (Rocha formula)
    const boneMass = height && this.calculateBoneMass(height, weight, gender);

    // Calculate residual mass (gender-specific percentages)
    const residualMass = this.calculateResidualMass(weight, gender);

    // Calculate muscle mass (remaining after subtracting other components)
    const muscleMass = boneMass && residualMass
      ? this.round(leanMass - boneMass - residualMass, 2)
      : undefined;

    return {
      bodyDensity: this.round(bodyDensity, 4),
      bodyFatPercentage: this.round(bodyFatPercentage, 2),
      fatMass,
      leanMass,
      muscleMass,
      boneMass,
      residualMass,
      formula: `${protocol.toUpperCase()}_${densityEquation.toUpperCase()}`,
      sumOfFolds: this.round(sumOfFolds, 1),
    };
  }

  /**
   * Jackson-Pollock 3 Folds Protocol
   * Folds: Chest/Pectoral, Abdomen, Thigh
   */
  private static calculateJP3(
    gender: "M" | "F",
    age: number,
    folds: { [key: string]: number }
  ): { bodyDensity: number; sumOfFolds: number } {
    const chest = folds.peitoral || folds.chest || 0;
    const abdomen = folds.abdominal || folds.abdomen || 0;
    const thigh = folds.coxa || folds.thigh || 0;

    const sumOfFolds = chest + abdomen + thigh;

    let bodyDensity: number;

    if (gender === "M") {
      // Men formula
      bodyDensity =
        1.10938 - 0.0008267 * sumOfFolds + 0.0000016 * sumOfFolds * sumOfFolds - 0.0002574 * age;
    } else {
      // Women formula
      bodyDensity =
        1.0994921 - 0.0009929 * sumOfFolds + 0.0000023 * sumOfFolds * sumOfFolds - 0.0001392 * age;
    }

    return { bodyDensity, sumOfFolds };
  }

  /**
   * Jackson-Pollock 7 Folds Protocol (Current system default)
   * Folds: Triceps, Chest, Subscapular, Axillary, Suprailiac, Abdomen, Thigh
   */
  private static calculateJP7(
    gender: "M" | "F",
    age: number,
    folds: { [key: string]: number }
  ): { bodyDensity: number; sumOfFolds: number } {
    const triceps = folds.triceps || 0;
    const chest = folds.peitoral || folds.chest || 0;
    const subscapular = folds.subescapular || folds.subscapular || 0;
    const axillary = folds.axilar || folds.axillary || 0;
    const suprailiac = folds.supra || folds.suprailiac || 0;
    const abdomen = folds.abdominal || folds.abdomen || 0;
    const thigh = folds.coxa || folds.thigh || 0;

    const sumOfFolds = triceps + chest + subscapular + axillary + suprailiac + abdomen + thigh;

    let bodyDensity: number;

    if (gender === "M") {
      // Men formula (matches existing system calculation)
      bodyDensity =
        1.112 - 0.00043499 * sumOfFolds + 0.00000055 * sumOfFolds * sumOfFolds - 0.00028826 * age;
    } else {
      // Women formula (matches existing system calculation)
      bodyDensity =
        1.097 - 0.00046971 * sumOfFolds + 0.00000056 * sumOfFolds * sumOfFolds - 0.00012828 * age;
    }

    return { bodyDensity, sumOfFolds };
  }

  /**
   * Durnin-Womersley 4 Folds Protocol
   * Folds: Biceps, Triceps, Subscapular, Suprailiac
   */
  private static calculateDW4(
    gender: "M" | "F",
    age: number,
    folds: { [key: string]: number }
  ): { bodyDensity: number; sumOfFolds: number } {
    const biceps = folds.biceps || 0;
    const triceps = folds.triceps || 0;
    const subscapular = folds.subescapular || folds.subscapular || 0;
    const suprailiac = folds.supra || folds.suprailiac || 0;

    const sumOfFolds = biceps + triceps + subscapular + suprailiac;
    const logSum = Math.log10(sumOfFolds);

    let bodyDensity: number;

    // Age and gender-specific equations
    if (gender === "M") {
      if (age >= 17 && age <= 19) {
        bodyDensity = 1.1620 - 0.0630 * logSum;
      } else if (age >= 20 && age <= 29) {
        bodyDensity = 1.1631 - 0.0632 * logSum;
      } else if (age >= 30 && age <= 39) {
        bodyDensity = 1.1422 - 0.0544 * logSum;
      } else if (age >= 40 && age <= 49) {
        bodyDensity = 1.162 - 0.07 * logSum;
      } else {
        // 50+ years
        bodyDensity = 1.1715 - 0.0779 * logSum;
      }
    } else {
      // Women
      if (age >= 17 && age <= 19) {
        bodyDensity = 1.1549 - 0.0678 * logSum;
      } else if (age >= 20 && age <= 29) {
        bodyDensity = 1.1599 - 0.0717 * logSum;
      } else if (age >= 30 && age <= 39) {
        bodyDensity = 1.1423 - 0.0632 * logSum;
      } else if (age >= 40 && age <= 49) {
        bodyDensity = 1.1333 - 0.0612 * logSum;
      } else {
        // 50+ years
        bodyDensity = 1.1339 - 0.0645 * logSum;
      }
    }

    return { bodyDensity, sumOfFolds };
  }

  /**
   * Convert body density to body fat percentage
   */
  private static bodyDensityToFatPercentage(
    density: number,
    equation: "siri" | "brozek" = "siri"
  ): number {
    if (equation === "siri") {
      // Siri equation (1961) - most commonly used
      return (495 / density - 450) * 100;
    } else {
      // Brozek equation (1963)
      return (457 / density - 414.2) * 100;
    }
  }

  /**
   * Calculate bone mass using Rocha formula
   * Based on height, wrist diameter, and knee diameter
   */
  private static calculateBoneMass(height: number, weight: number, gender: "M" | "F"): number {
    // Simplified estimation when wrist/knee not available
    // Uses height-based approximation
    // const heightInMeters = height / 100;

    // Rocha simplified formula: 3.02 * (height² * estimated bone density)^0.712
    // Using weight-based estimation for bone density
    let boneMass: number;

    if (gender === "M") {
      boneMass = 0.0326 * weight + 0.0000267 * height - 0.0484;
    } else {
      boneMass = 0.0235 * weight + 0.0000267 * height - 0.0415;
    }

    return this.round(boneMass, 2);
  }

  /**
   * Calculate residual mass
   * Gender-specific percentages of body weight
   */
  private static calculateResidualMass(weight: number, gender: "M" | "F"): number {
    const percentage = gender === "M" ? 0.241 : 0.209;
    return this.round(weight * percentage, 2);
  }

  /**
   * Round to specified decimal places
   */
  private static round(value: number, decimals: number): number {
    return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals);
  }
}
