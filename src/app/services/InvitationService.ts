import { auth } from "@/infra/firebase/firebaseConfig";

/**
 * Invitation Service
 * Handles HTTP API calls to Firebase Cloud Functions for invitation management
 */

// Get Firebase Functions API base URL
const getFunctionsUrl = () => {
  // Check if running in emulator
  const isEmulator = window.location.hostname === "localhost";

  if (isEmulator) {
    // Local emulator URL
    return "http://localhost:5001/nutri-office/us-central1/api";
  }

  // Production URL - update with your actual project ID
  return "https://us-central1-nutri-office.cloudfunctions.net/api";
};

const API_BASE_URL = getFunctionsUrl();

/**
 * Get auth token for API requests
 */
const getAuthToken = async (): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User not authenticated");
  }
  return await currentUser.getIdToken();
};

/**
 * Make authenticated API request
 */
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: response.statusText,
      }));
      throw new Error(error.error || error.message || "API request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

/**
 * Make public API request (no auth required)
 */
const publicApiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: response.statusText,
      }));
      throw new Error(error.error || error.message || "API request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Public API request error:", error);
    throw error;
  }
};

// Types
export interface SendInvitationData {
  email: string;
  role: string;
  permissions?: string[];
}

export interface SendInvitationResponse {
  message: string;
  invitationId: string;
  emailSent: boolean;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  status: "pending" | "accepted" | "expired" | "revoked";
  createdAt: string;
  expiresAt: string;
}

export interface InvitationByToken {
  id: string;
  email: string;
  professionalName: string;
  professionalId: string;
  role: string;
  status: string;
  expiresAt: string;
}

export interface AcceptInvitationData {
  userId: string;
}

export interface AcceptInvitationResponse {
  message: string;
  professionalId: string;
}

/**
 * Invitation Service API
 */
export const InvitationService = {
  /**
   * Send invitation to a collaborator
   */
  sendInvitation: async (
    userId: string,
    data: SendInvitationData
  ): Promise<SendInvitationResponse> => {
    return apiRequest<SendInvitationResponse>(
      `/users/${userId}/invitations`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * Get all invitations for a professional
   */
  getInvitations: async (
    userId: string,
    status?: string
  ): Promise<Invitation[]> => {
    const queryParams = status ? `?status=${status}` : "";
    return apiRequest<Invitation[]>(
      `/users/${userId}/invitations${queryParams}`
    );
  },

  /**
   * Get invitation details by token (public, no auth)
   */
  getInvitationByToken: async (
    token: string
  ): Promise<InvitationByToken> => {
    return publicApiRequest<InvitationByToken>(`/invitations/${token}`);
  },

  /**
   * Accept invitation (public, no auth)
   */
  acceptInvitation: async (
    token: string,
    data: AcceptInvitationData
  ): Promise<AcceptInvitationResponse> => {
    return publicApiRequest<AcceptInvitationResponse>(
      `/invitations/${token}/accept`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * Revoke/cancel an invitation
   */
  revokeInvitation: async (
    userId: string,
    invitationId: string
  ): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      `/users/${userId}/invitations/${invitationId}`,
      {
        method: "DELETE",
      }
    );
  },

  /**
   * Resend invitation email
   */
  resendInvitation: async (
    userId: string,
    invitationId: string
  ): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      `/users/${userId}/invitations/${invitationId}/resend`,
      {
        method: "POST",
      }
    );
  },
};
