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
export type AppointmentType = "online" | "presencial" | "reavaliacao" | "consultoria" | "hibrido";

/**
 * Form submission entity (Firebase format with Timestamp)
 */
export interface IFormSubmissionFirebase {
  id: string;
  status: FormSubmissionStatus;
  appointmentType: AppointmentType;

  customerData: ICustomerFirebase;
  anamnesisData: IAnamnesis;
  evaluationData?: IEvaluationData;
  feedingHistory?: Array<{ time: string; meal: string }>;
  attachments?: Array<{ filename: string; originalName: string; url: string; size: number }>;

  submittedAt: Timestamp;
  processedAt?: Timestamp;
  processedBy?: string;
  createdCustomerId?: string;
  createdConsultaId?: string;
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
  evaluationData?: IEvaluationData;
  feedingHistory?: Array<{ time: string; meal: string }>;
  attachments?: Array<{ filename: string; originalName: string; url: string; size: number }>;

  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  createdCustomerId?: string;
  createdConsultaId?: string;
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
  enableFeedingHistory?: boolean;
  enableAttachments?: boolean;
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
  evaluationData?: IEvaluationData;
  feedingHistory?: Array<{ time: string; meal: string }>;
  attachments?: Array<{ filename: string; originalName: string; url: string; size: number }>;
}

/**
 * Form submission response
 */
export interface IFormSubmissionResponse {
  success: boolean;
  submissionId: string;
  message: string;
}
