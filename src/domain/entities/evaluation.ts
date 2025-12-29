/**
 * Evaluation domain entities
 * Defines types for configurable evaluation system
 */

export interface IEvaluationPreset {
  id: string;
  name: string;
  description: string;
  formula: string;
  fields: IEvaluationFields;
}

export interface IEvaluationFields {
  weight: IFieldConfig;
  height: IFieldConfig;
  measures?: IMeasuresConfig;
  photos?: IPhotosConfig;
  folds?: IFoldsConfig;
  bioimpedance?: IBioimpedanceConfig;
}

export interface IFieldConfig {
  enabled: boolean;
  label?: string;
  required?: boolean;
}

export interface IMeasuresConfig {
  enabled: boolean;
  points: IMeasurePoint[];
}

export interface IMeasurePoint {
  id: string;
  label: string;
  enabled: boolean;
}

export interface IPhotosConfig {
  enabled: boolean;
  label?: string;
  positions: string[]; // ["front", "back", "side"]
}

export interface IFoldsConfig {
  enabled: boolean;
  protocol?: string;
  points: IFoldPoint[];
}

export interface IFoldPoint {
  id: string;
  label: string;
  enabled: boolean;
}

export interface IBioimpedanceConfig {
  enabled: boolean;
  fields: IBioimpedanceField[];
}

export interface IBioimpedanceField {
  id: string;
  label: string;
  enabled: boolean;
}

/**
 * User's evaluation configuration
 * Stored in users/{userId}/settings/evaluation
 */
export interface IEvaluationConfig {
  online: IAppointmentTypeEvaluationConfig;
  presencial: IAppointmentTypeEvaluationConfig;
}

export interface IAppointmentTypeEvaluationConfig {
  enabled: boolean;
  basePreset?: string | null; // ID of preset (jp3folds, jp7folds, etc.) or null for fully custom
  fields: IEvaluationFields;
}

/**
 * Enabled evaluation fields for public form
 * Stored in anamnesisTokens/{type}/enabledEvaluationFields
 */
export interface IEnabledEvaluationFields {
  weight: boolean;
  height: boolean;
  measures: IMeasurePoint[]; // Array of enabled measure points with labels
  photos: boolean;
  folds: boolean; // Always false for patients
  bioimpedance: boolean; // Always false for patients
}

/**
 * Evaluation data submitted through public form
 */
export interface IEvaluationData {
  weight?: number;
  height?: number;
  measures?: { [pointId: string]: number };
  photos?: {
    front?: string; // Firebase Storage URL
    back?: string;
    side?: string;
  };
}
