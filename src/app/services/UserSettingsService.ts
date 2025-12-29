import { httpsCallable } from "firebase/functions";
import { functions } from "@/infra/firebase";

interface InitializeSettingsResponse {
  success: boolean;
  userId: string;
  role: string;
  settingsType: string;
  fieldsCount: number;
  created: boolean;
}

/**
 * Initialize settings for a user
 * If no userId is provided, initializes settings for the current user
 * Only admins can initialize settings for other users
 */
export async function initializeUserSettings(userId?: string): Promise<InitializeSettingsResponse> {
  const initializeSettings = httpsCallable<{ userId?: string }, InitializeSettingsResponse>(
    functions,
    "initializeUserSettings"
  );

  const result = await initializeSettings({ userId });
  return result.data;
}
