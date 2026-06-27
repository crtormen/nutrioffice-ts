import { firestoreApi } from "../firestoreApi";
import { auth } from "@/infra/firebase";
import { IEnabledEvaluationFields } from "@/domain/entities/evaluation";
import { AppointmentType } from "@/domain/entities/formSubmission";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/nutri-office/us-central1/api";

interface TokensResponse {
  onlineToken: string | null;
  presencialToken: string | null;
  reavaliacaoToken: string | null;
  consultoriaToken: string | null;
  hibridoToken: string | null;
  onlineEnabledFields: string[];
  presencialEnabledFields: string[];
  reavaliacaoEnabledFields: string[];
  consultoriaEnabledFields: string[];
  hibridoEnabledFields: string[];
  onlineEnabledEvaluationFields?: IEnabledEvaluationFields | null;
  presencialEnabledEvaluationFields?: IEnabledEvaluationFields | null;
  reavaliacaoEnabledEvaluationFields?: IEnabledEvaluationFields | null;
  consultoriaEnabledEvaluationFields?: IEnabledEvaluationFields | null;
  hibridoEnabledEvaluationFields?: IEnabledEvaluationFields | null;
  onlineEnableFeedingHistory?: boolean;
  presencialEnableFeedingHistory?: boolean;
  reavaliacaoEnableFeedingHistory?: boolean;
  consultoriaEnableFeedingHistory?: boolean;
  hibridoEnableFeedingHistory?: boolean;
  onlineEnableAttachments?: boolean;
  presencialEnableAttachments?: boolean;
  reavaliacaoEnableAttachments?: boolean;
  consultoriaEnableAttachments?: boolean;
  hibridoEnableAttachments?: boolean;
}

interface GenerateTokenRequest {
  uid: string;
  type: AppointmentType;
}

interface GenerateTokenResponse {
  token: string;
  url: string;
  isActive: boolean;
  type: AppointmentType;
}

/**
 * Helper to get auth token
 */
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  return await user.getIdToken(true);
};

/**
 * RTK Query slice for anamnesis tokens management
 */
export const anamnesisTokensSlice = firestoreApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Fetch both anamnesis tokens (online and presencial)
     */
    fetchAnamnesisTokens: builder.query<TokensResponse, string>({
      queryFn: async (uid) => {
        try {
          const token = await getAuthToken();
          const response = await fetch(`${API_BASE_URL}/users/${uid}/anamnesis-tokens`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            const error = await response.json();
            return { error: { status: response.status, data: error.error } };
          }

          const rawData = await response.json();

          // Transform API response to match TokensResponse interface
          const data: TokensResponse = {
            onlineToken: rawData.online?.token || null,
            presencialToken: rawData.presencial?.token || null,
            reavaliacaoToken: rawData.reavaliacao?.token || null,
            consultoriaToken: rawData.consultoria?.token || null,
            hibridoToken: rawData.hibrido?.token || null,
            onlineEnabledFields: rawData.online?.enabledFields || [],
            presencialEnabledFields: rawData.presencial?.enabledFields || [],
            reavaliacaoEnabledFields: rawData.reavaliacao?.enabledFields || [],
            consultoriaEnabledFields: rawData.consultoria?.enabledFields || [],
            hibridoEnabledFields: rawData.hibrido?.enabledFields || [],
            onlineEnabledEvaluationFields: rawData.online?.enabledEvaluationFields || null,
            presencialEnabledEvaluationFields: rawData.presencial?.enabledEvaluationFields || null,
            reavaliacaoEnabledEvaluationFields: rawData.reavaliacao?.enabledEvaluationFields || null,
            consultoriaEnabledEvaluationFields: rawData.consultoria?.enabledEvaluationFields || null,
            hibridoEnabledEvaluationFields: rawData.hibrido?.enabledEvaluationFields || null,
            onlineEnableFeedingHistory: rawData.online?.enableFeedingHistory ?? false,
            presencialEnableFeedingHistory: rawData.presencial?.enableFeedingHistory ?? false,
            reavaliacaoEnableFeedingHistory: rawData.reavaliacao?.enableFeedingHistory ?? false,
            consultoriaEnableFeedingHistory: rawData.consultoria?.enableFeedingHistory ?? false,
            hibridoEnableFeedingHistory: rawData.hibrido?.enableFeedingHistory ?? false,
            onlineEnableAttachments: rawData.online?.enableAttachments ?? false,
            presencialEnableAttachments: rawData.presencial?.enableAttachments ?? false,
            reavaliacaoEnableAttachments: rawData.reavaliacao?.enableAttachments ?? false,
            consultoriaEnableAttachments: rawData.consultoria?.enableAttachments ?? false,
            hibridoEnableAttachments: rawData.hibrido?.enableAttachments ?? false,
          };

          return { data };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      providesTags: ["AnamnesisTokens"],
    }),

    /**
     * Toggle feeding history section for a specific form type
     */
    updateFeedingHistoryToken: builder.mutation<void, { uid: string; type: AppointmentType; enableFeedingHistory: boolean }>({
      queryFn: async ({ uid, type, enableFeedingHistory }) => {
        try {
          const token = await getAuthToken();
          const response = await fetch(
            `${API_BASE_URL}/users/${uid}/anamnesis-tokens/${type}/feeding-history`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ enableFeedingHistory }),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            return { error: { status: response.status, data: error.error } };
          }

          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["AnamnesisTokens"],
    }),

    /**
     * Toggle attachments section for a specific form type
     */
    updateAttachmentsToken: builder.mutation<void, { uid: string; type: AppointmentType; enableAttachments: boolean }>({
      queryFn: async ({ uid, type, enableAttachments }) => {
        try {
          const token = await getAuthToken();
          const response = await fetch(
            `${API_BASE_URL}/users/${uid}/anamnesis-tokens/${type}/attachments`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ enableAttachments }),
            }
          );
          if (!response.ok) {
            const error = await response.json();
            return { error: { status: response.status, data: error.error } };
          }
          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["AnamnesisTokens"],
    }),

    /**
     * Generate or regenerate an anamnesis token
     */
    generateAnamnesisToken: builder.mutation<GenerateTokenResponse, GenerateTokenRequest>({
      queryFn: async ({ uid, type }) => {
        try {
          const token = await getAuthToken();
          const response = await fetch(`${API_BASE_URL}/users/${uid}/anamnesis-tokens/generate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ type }),
          });

          if (!response.ok) {
            const error = await response.json();
            return { error: { status: response.status, data: error.error } };
          }

          const data = await response.json();
          return { data };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["AnamnesisTokens"],
    }),
  }),
});

export const {
  useFetchAnamnesisTokensQuery,
  useGenerateAnamnesisTokenMutation,
  useUpdateFeedingHistoryTokenMutation,
  useUpdateAttachmentsTokenMutation,
} = anamnesisTokensSlice;
