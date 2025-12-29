import { createSelector } from "@reduxjs/toolkit";
import { QuerySnapshot } from "firebase/firestore";
import { firestoreApi } from "../firestoreApi";
import { IFormSubmission } from "@/domain/entities/formSubmission";
import { FormSubmissionsService } from "@/app/services/FormSubmissionsService";

/**
 * RTK Query slice for form submissions with real-time updates
 */
export const formSubmissionsSlice = firestoreApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Fetch all form submissions with real-time updates
     */
    fetchFormSubmissions: builder.query<IFormSubmission[], string>({
      queryFn: () => ({ data: [] }),
      providesTags: ["FormSubmissions"],
      async onCacheEntryAdded(
        uid,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        let unsubscribe: (() => void) | undefined;
        try {
          await cacheDataLoaded;

          const service = FormSubmissionsService(uid);
          if (!service) {
            console.warn("FormSubmissionsService not available for uid:", uid);
            return;
          }

          unsubscribe = service.getAll((snapshot: QuerySnapshot) => {
            const submissions = snapshot.docs.map((doc: any) => doc.data()) as IFormSubmission[];
            updateCachedData(() => submissions);
          });
        } catch (error) {
          console.error("Error in fetchFormSubmissions cache entry:", error);
        }

        await cacheEntryRemoved;
        unsubscribe?.();
      },
    }),

    /**
     * Approve form submission
     */
    approveFormSubmission: builder.mutation<
      any,
      {
        uid: string;
        submissionId: string;
        customerData: any;
        anamnesisData: Record<string, string | string[]>;
      }
    >({
      queryFn: async ({ uid, submissionId, customerData, anamnesisData }) => {
        try {
          const service = FormSubmissionsService(uid);
          if (!service) {
            return { error: { status: 400, data: "Invalid uid" } };
          }

          const result = await service.approve(submissionId, {
            customerData,
            anamnesisData,
          });
          return { data: result };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["FormSubmissions", "Customers"],
    }),

    /**
     * Reject form submission
     */
    rejectFormSubmission: builder.mutation<
      any,
      { uid: string; submissionId: string }
    >({
      queryFn: async ({ uid, submissionId }) => {
        try {
          const service = FormSubmissionsService(uid);
          if (!service) {
            return { error: { status: 400, data: "Invalid uid" } };
          }

          const result = await service.reject(submissionId);
          return { data: result };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["FormSubmissions"],
    }),

    /**
     * Update form submission
     */
    updateFormSubmission: builder.mutation<
      any,
      {
        uid: string;
        submissionId: string;
        customerData?: any;
        anamnesisData?: Record<string, string | string[]>;
      }
    >({
      queryFn: async ({ uid, submissionId, customerData, anamnesisData }) => {
        try {
          const service = FormSubmissionsService(uid);
          if (!service) {
            return { error: { status: 400, data: "Invalid uid" } };
          }

          const result = await service.update(submissionId, {
            customerData,
            anamnesisData,
          });
          return { data: result };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["FormSubmissions"],
    }),
  }),
});

export const {
  useFetchFormSubmissionsQuery,
  useApproveFormSubmissionMutation,
  useRejectFormSubmissionMutation,
  useUpdateFormSubmissionMutation,
} = formSubmissionsSlice;

/**
 * Selector to get all form submissions
 */
export const selectFormSubmissions = (uid: string | undefined) => {
  return (state: any) => {
    if (!uid) return [];
    const result = formSubmissionsSlice.endpoints.fetchFormSubmissions.select(uid)(state);
    return result.data || [];
  };
};

/**
 * Selector to get pending submissions count
 */
export const selectPendingSubmissionsCount = (uid: string | undefined) =>
  createSelector(
    selectFormSubmissions(uid),
    (submissions) => submissions.filter((s) => s.status === "pending").length
  );

/**
 * Selector to get pending submissions
 */
export const selectPendingSubmissions = (uid: string | undefined) =>
  createSelector(
    selectFormSubmissions(uid),
    (submissions) => submissions.filter((s) => s.status === "pending")
  );

/**
 * Selector to get approved submissions
 */
export const selectApprovedSubmissions = (uid: string | undefined) =>
  createSelector(
    selectFormSubmissions(uid),
    (submissions) => submissions.filter((s) => s.status === "approved")
  );

/**
 * Selector to get rejected submissions
 */
export const selectRejectedSubmissions = (uid: string | undefined) =>
  createSelector(
    selectFormSubmissions(uid),
    (submissions) => submissions.filter((s) => s.status === "rejected")
  );
