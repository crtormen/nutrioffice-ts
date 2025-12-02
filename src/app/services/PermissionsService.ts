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
import {
  PermissionsConfig,
  DEFAULT_PERMISSIONS,
  Abilities,
  RolePermissions,
} from "@/domain/entities";

/**
 * Firestore interface for Permissions with Timestamp
 */
export interface PermissionsConfigFirebase {
  rolePermissions: Partial<Record<Abilities, RolePermissions>>;
  updatedAt?: any; // Firestore Timestamp
}

/**
 * Permissions Service
 * Manages role-based permissions stored in Firestore
 * Path: users/{professionalId}/settings/permissions
 */
export const PermissionsService = (uid: string | undefined) => {
  if (!uid) return null;

  const permissionsDocRef = doc(db, `users/${uid}/settings/permissions`);

  // Firestore converter
  const converter = {
    toFirestore(data: Partial<PermissionsConfig>): DocumentData {
      return {
        rolePermissions: data.rolePermissions || {},
        updatedAt: serverTimestamp(),
      };
    },
    fromFirestore(
      snapshot: QueryDocumentSnapshot,
      options: SnapshotOptions
    ): PermissionsConfig {
      const data = snapshot.data(options) as PermissionsConfigFirebase;
      return {
        rolePermissions: data.rolePermissions || {},
        updatedAt: data.updatedAt?.toDate().toISOString(),
      };
    },
  };

  return {
    /**
     * Get permissions configuration
     * Returns default permissions if document doesn't exist
     */
    get: async (): Promise<PermissionsConfig> => {
      const docSnap = await getDoc(permissionsDocRef.withConverter(converter));

      if (docSnap.exists()) {
        const data = docSnap.data();
        return data as PermissionsConfig;
      }

      // Return default permissions if not configured yet
      return {
        rolePermissions: DEFAULT_PERMISSIONS,
      };
    },

    /**
     * Update permissions for specific roles
     */
    update: async (
      rolePermissions: Partial<Record<Abilities, RolePermissions>>
    ): Promise<void> => {
      await setDoc(
        permissionsDocRef.withConverter(converter),
        {
          rolePermissions,
        },
        { merge: true }
      );
    },

    /**
     * Reset to default permissions
     */
    reset: async (): Promise<void> => {
      await setDoc(permissionsDocRef.withConverter(converter), {
        rolePermissions: DEFAULT_PERMISSIONS,
      });
    },

    /**
     * Get permissions for a specific role
     */
    getForRole: async (role: Abilities): Promise<RolePermissions> => {
      const config = await PermissionsService(uid)?.get();
      return (
        config?.rolePermissions[role] || DEFAULT_PERMISSIONS[role]
      );
    },
  };
};
