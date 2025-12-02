import {
  InvitationService,
  type Invitation,
  type SendInvitationData,
  type InvitationByToken,
  type AcceptInvitationData,
} from "@/app/services/InvitationService";

import { firestoreApi } from "../firestoreApi";

/**
 * Invitations Slice
 * Manages invitation state via RTK Query
 */
export const invitationsSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["Invitations"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      /**
       * Send invitation to collaborator
       */
      sendInvitation: builder.mutation<
        { message: string; invitationId: string; emailSent: boolean },
        { userId: string; data: SendInvitationData }
      >({
        invalidatesTags: ["Invitations"],
        queryFn: async ({ userId, data }) => {
          try {
            const result = await InvitationService.sendInvitation(userId, data);
            return { data: result };
          } catch (error: any) {
            return { error: error.message || "Failed to send invitation" };
          }
        },
      }),

      /**
       * Fetch all invitations for a professional
       */
      fetchInvitations: builder.query<
        Invitation[],
        { userId: string; status?: string }
      >({
        providesTags: ["Invitations"],
        queryFn: async ({ userId, status }) => {
          try {
            const invitations = await InvitationService.getInvitations(
              userId,
              status
            );
            return { data: invitations };
          } catch (error: any) {
            return { error: error.message || "Failed to fetch invitations" };
          }
        },
      }),

      /**
       * Get invitation by token (public - for registration page)
       */
      fetchInvitationByToken: builder.query<InvitationByToken, string>({
        queryFn: async (token) => {
          try {
            const invitation = await InvitationService.getInvitationByToken(
              token
            );
            return { data: invitation };
          } catch (error: any) {
            return { error: error.message || "Failed to fetch invitation" };
          }
        },
      }),

      /**
       * Accept invitation (public - for registration page)
       */
      acceptInvitation: builder.mutation<
        { message: string; professionalId: string },
        { token: string; data: AcceptInvitationData }
      >({
        queryFn: async ({ token, data }) => {
          try {
            const result = await InvitationService.acceptInvitation(
              token,
              data
            );
            return { data: result };
          } catch (error: any) {
            return { error: error.message || "Failed to accept invitation" };
          }
        },
      }),

      /**
       * Revoke invitation
       */
      revokeInvitation: builder.mutation<
        { message: string },
        { userId: string; invitationId: string }
      >({
        invalidatesTags: ["Invitations"],
        queryFn: async ({ userId, invitationId }) => {
          try {
            const result = await InvitationService.revokeInvitation(
              userId,
              invitationId
            );
            return { data: result };
          } catch (error: any) {
            return { error: error.message || "Failed to revoke invitation" };
          }
        },
      }),

      /**
       * Resend invitation email
       */
      resendInvitation: builder.mutation<
        { message: string },
        { userId: string; invitationId: string }
      >({
        queryFn: async ({ userId, invitationId }) => {
          try {
            const result = await InvitationService.resendInvitation(
              userId,
              invitationId
            );
            return { data: result };
          } catch (error: any) {
            return { error: error.message || "Failed to resend invitation" };
          }
        },
      }),
    }),
  });

// Export hooks
export const {
  useSendInvitationMutation,
  useFetchInvitationsQuery,
  useLazyFetchInvitationsQuery,
  useFetchInvitationByTokenQuery,
  useLazyFetchInvitationByTokenQuery,
  useAcceptInvitationMutation,
  useRevokeInvitationMutation,
  useResendInvitationMutation,
} = invitationsSlice;
