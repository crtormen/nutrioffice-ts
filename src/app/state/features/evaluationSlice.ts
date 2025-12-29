import { firestoreApi } from "../firestoreApi";
import { auth } from "@/infra/firebase";
import {
  IEvaluationPreset,
  IEvaluationConfig,
  IAppointmentTypeEvaluationConfig,
} from "@/domain/entities/evaluation";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/nutri-office/us-central1/api";

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
 * RTK Query slice for evaluation configuration management
 */
export const evaluationSlice = firestoreApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Fetch available evaluation presets
     */
    fetchEvaluationPresets: builder.query<IEvaluationPreset[], string>({
      queryFn: async (uid) => {
        try {
          const token = await getAuthToken();
          const response = await fetch(`${API_BASE_URL}/users/${uid}/evaluation-presets`, {
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

          const data = await response.json();
          return { data };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      providesTags: ["EvaluationPresets"],
    }),

    /**
     * Fetch user's evaluation configuration
     */
    fetchEvaluationConfig: builder.query<IEvaluationConfig, string>({
      queryFn: async (uid) => {
        try {
          const token = await getAuthToken();
          const response = await fetch(`${API_BASE_URL}/users/${uid}/evaluation-config`, {
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

          const data = await response.json();
          return { data };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      providesTags: ["EvaluationConfig"],
    }),

    /**
     * Update evaluation configuration for a specific appointment type
     */
    updateEvaluationConfig: builder.mutation<
      void,
      {
        uid: string;
        type: "online" | "presencial";
        config: IAppointmentTypeEvaluationConfig;
      }
    >({
      queryFn: async ({ uid, type, config }) => {
        try {
          const token = await getAuthToken();
          const response = await fetch(`${API_BASE_URL}/users/${uid}/evaluation-config/${type}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(config),
          });

          if (!response.ok) {
            const error = await response.json();
            return { error: { status: response.status, data: error.error } };
          }

          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["EvaluationConfig"],
    }),
  }),
});

export const {
  useFetchEvaluationPresetsQuery,
  useFetchEvaluationConfigQuery,
  useUpdateEvaluationConfigMutation,
} = evaluationSlice;
