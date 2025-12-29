import {
  IPublicFormConfiguration,
  IFormSubmissionData,
  IFormSubmissionResponse,
} from "@/domain/entities/formSubmission";
import { IEnabledEvaluationFields } from "@/domain/entities/evaluation";
import { auth } from "@/infra/firebase/firebaseConfig";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/nutri-office/us-central1/api";

/**
 * Service for public anamnesis form operations (no authentication required)
 */
export const PublicFormService = {
  /**
   * Get form configuration by token
   * This endpoint is public and doesn't require authentication
   */
  getFormByToken: async (token: string): Promise<IPublicFormConfiguration> => {
    const response = await fetch(`${API_BASE_URL}/public/anamnesis-form/${token}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Falha ao carregar formulário");
    }

    return response.json();
  },

  /**
   * Submit form data
   * This endpoint is public and doesn't require authentication
   */
  submitForm: async (
    token: string,
    data: IFormSubmissionData
  ): Promise<IFormSubmissionResponse> => {
    const response = await fetch(`${API_BASE_URL}/public/anamnesis-form/${token}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Falha ao enviar formulário");
    }

    return response.json();
  },
};

/**
 * Update anamnesis form token enabled fields (requires authentication)
 */
export const updateAnamnesisFormToken = async (
  uid: string,
  appointmentType: "online" | "presencial",
  enabledFields: string[]
): Promise<void> => {
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(
    `${API_BASE_URL}/users/${uid}/anamnesis-tokens/${appointmentType}/fields`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ enabledFields }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Falha ao atualizar campos");
  }
};

/**
 * Update evaluation form token enabled fields (requires authentication)
 */
export const updateEvaluationFormToken = async (
  uid: string,
  appointmentType: "online" | "presencial",
  enabledEvaluationFields: IEnabledEvaluationFields
): Promise<void> => {
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(
    `${API_BASE_URL}/users/${uid}/anamnesis-tokens/${appointmentType}/evaluation-fields`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ enabledEvaluationFields }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Falha ao atualizar campos de avaliação");
  }
};
