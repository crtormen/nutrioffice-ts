import { Timestamp } from "firebase/firestore";
import { ICustomer, ICustomerFirebase } from "./customer";
import { IAnamnesis } from "./anamnesis";
import { IEvaluationData, IEnabledEvaluationFields } from "./evaluation";

/**
 * Form submission status types
 */
export type FormSubmissionStatus = "pending" | "approved" | "rejected";

/**
 * Appointment type for form submissions
 */
export type AppointmentType = "online" | "presencial";

/**
 * Form submission entity (Firebase format with Timestamp)
 */
export interface IFormSubmissionFirebase {
  id: string;
  status: FormSubmissionStatus;
  appointmentType: AppointmentType;

  customerData: ICustomerFirebase;
  anamnesisData: IAnamnesis;
  evaluationData?: IEvaluationData; // NEW: Optional evaluation data

  submittedAt: Timestamp;
  processedAt?: Timestamp;
  processedBy?: string;
  createdCustomerId?: string;
  createdConsultaId?: string; // NEW: ID of created consulta (if evaluation data was submitted)
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Form submission entity (App format with ISO date strings)
 */
export interface IFormSubmission {
  id: string;
  status: FormSubmissionStatus;
  appointmentType: AppointmentType;

  customerData: ICustomer;
  anamnesisData: IAnamnesis;
  evaluationData?: IEvaluationData; // NEW: Optional evaluation data

  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  createdCustomerId?: string;
  createdConsultaId?: string; // NEW: ID of created consulta (if evaluation data was submitted)
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Anamnesis token entity (Firebase format)
 */
export interface IAnamnesisTokenFirebase {
  token: string;
  type: AppointmentType;
  professionalId: string;
  createdAt: Timestamp;
  regeneratedAt?: Timestamp;
  isActive: boolean;
  submissionsCount: number;
  lastSubmissionAt?: Timestamp;
  enabledFields: string[]; // Anamnesis fields
  enabledEvaluationFields?: IEnabledEvaluationFields; // NEW: Evaluation fields
}

/**
 * Anamnesis token entity (App format)
 */
export interface IAnamnesisToken {
  token: string;
  type: AppointmentType;
  professionalId: string;
  createdAt: string;
  regeneratedAt?: string;
  isActive: boolean;
  submissionsCount: number;
  lastSubmissionAt?: string;
  enabledFields: string[]; // Anamnesis fields
  enabledEvaluationFields?: IEnabledEvaluationFields; // NEW: Evaluation fields
}

/**
 * Public form settings for a specific appointment type
 */
export interface IPublicFormTypeSettings {
  enabledFields: string[];
  customMessage?: string;
  successMessage?: string;
  requireAllFields: boolean;
}

/**
 * Public form settings document
 */
export interface IPublicFormSettings {
  online: IPublicFormTypeSettings;
  presencial: IPublicFormTypeSettings;
  notifications: {
    emailEnabled: boolean;
    inAppEnabled: boolean;
    emailTo?: string;
  };
}

/**
 * Form configuration returned to public form page
 */
export interface IPublicFormConfiguration {
  professionalName: string;
  professionalId: string;
  logo: string;
  appointmentType: AppointmentType;
  customMessage?: string;
  successMessage?: string;
  requireAllFields: boolean;
  enabledFields: string[]; // Anamnesis fields
  anamnesisFields: Record<string, any>;
  enabledEvaluationFields?: IEnabledEvaluationFields; // NEW: Evaluation fields configuration
  tokenValid: boolean;
}

/**
 * Form submission data from public form
 */
export interface IFormSubmissionData {
  customerData: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
    gender: "H" | "M";
    birthday: string; // ISO date string
    occupation?: string;
    instagram?: string;
    cameBy?: string;
  };
  anamnesisData: Record<string, string | string[]>;
  evaluationData?: IEvaluationData; // NEW: Optional evaluation data
}

/**
 * Form submission response
 */
export interface IFormSubmissionResponse {
  success: boolean;
  submissionId: string;
  message: string;
}
