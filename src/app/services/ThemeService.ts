import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

import { db } from "@/infra/firebase/firebaseConfig";
import { ThemeConfig, DEFAULT_THEME } from "@/domain/entities";

/**
 * Theme Service
 * Manages theme configuration stored in Firestore
 * Path: users/{uid}/settings/theme
 */
export const ThemeService = (uid: string | undefined) => {
  if (!uid) return null;

  const themeDocRef = doc(db, `users/${uid}/settings/theme`);

  // Firestore converter
  const converter = {
    toFirestore(data: Partial<ThemeConfig>): DocumentData {
      return {
        ...data,
        updatedAt: serverTimestamp(),
      };
    },
    fromFirestore(
      snapshot: QueryDocumentSnapshot,
      options: SnapshotOptions
    ): ThemeConfig {
      const data = snapshot.data(options);
      return {
        ...data,
        updatedAt: data.updatedAt?.toDate().toISOString(),
      } as ThemeConfig;
    },
  };

  return {
    /**
     * Get theme configuration
     * Returns default theme if document doesn't exist
     */
    get: async (): Promise<ThemeConfig> => {
      const docSnap = await getDoc(themeDocRef.withConverter(converter));

      if (docSnap.exists()) {
        const data = docSnap.data();
        return data as ThemeConfig;
      }

      // Return default theme if not configured yet
      return DEFAULT_THEME;
    },

    /**
     * Update theme configuration
     */
    update: async (theme: Partial<ThemeConfig>): Promise<void> => {
      await setDoc(themeDocRef.withConverter(converter), theme, {
        merge: true,
      });
    },

    /**
     * Reset to default theme
     */
    reset: async (): Promise<void> => {
      await setDoc(themeDocRef.withConverter(converter), DEFAULT_THEME);
    },
  };
};
