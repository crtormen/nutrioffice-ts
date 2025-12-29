import { firestoreApi } from "../firestoreApi";
import { auth } from "@/infra/firebase";
import { IEnabledEvaluationFields } from "@/domain/entities/evaluation";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/nutri-office/us-central1/api";

interface TokensResponse {
  onlineToken: string | null;
  presencialToken: string | null;
  onlineEnabledFields: string[];
  presencialEnabledFields: string[];
  onlineEnabledEvaluationFields?: IEnabledEvaluationFields | null;
  presencialEnabledEvaluationFields?: IEnabledEvaluationFields | null;
}

interface GenerateTokenRequest {
  uid: string;
  type: "online" | "presencial";
}

interface GenerateTokenResponse {
  token: string;
  url: string;
  isActive: boolean;
  type: "online" | "presencial";
}

/**
 * Helper to get auth token
 */
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  return await user.getIdToken();
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
            onlineEnabledFields: rawData.online?.enabledFields || [],
            presencialEnabledFields: rawData.presencial?.enabledFields || [],
            onlineEnabledEvaluationFields: rawData.online?.enabledEvaluationFields || null,
            presencialEnabledEvaluationFields: rawData.presencial?.enabledEvaluationFields || null,
          };

          return { data };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      providesTags: ["AnamnesisTokens"],
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
} = anamnesisTokensSlice;
