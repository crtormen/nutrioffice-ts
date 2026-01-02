import { useMemo } from "react";
import { useFetchPermissionsQuery } from "@/app/state/features/permissionsSlice";
import { useAuth } from "@/infra/firebase";
import {
  Resource,
  AccessLevel,
  hasPermission,
  DEFAULT_PERMISSIONS,
  Abilities,
} from "@/domain/entities";

// Helper function for backward compatibility with old "NUTRI" role
const isProfessionalRole = (role: string | undefined): boolean => {
  return role === "PROFESSIONAL" || role === "NUTRI";
};

/**
 * Hook to check user permissions
 * Provides easy permission checking for the current user
 */
export const usePermissions = () => {
  const { dbUid, user } = useAuth();
  const userRole = (user as any)?.roles?.ability as Abilities | undefined;

  // Fetch permissions configuration
  const { data: permissionsConfig } = useFetchPermissionsQuery(dbUid || "", {
    skip: !dbUid,
  });

  // Get current user's role permissions
  const rolePermissions = useMemo(() => {
    if (!userRole) return null;

    // PROFESSIONAL or NUTRI (legacy) always have full access
    if (isProfessionalRole(userRole)) {
      return DEFAULT_PERMISSIONS.PROFESSIONAL;
    }

    // Get role permissions from config, fallback to defaults
    return (
      permissionsConfig?.rolePermissions[userRole] ||
      DEFAULT_PERMISSIONS[userRole]
    );
  }, [userRole, permissionsConfig]);

  /**
   * Check if user can perform action on a resource
   */
  const can = (resource: Resource, level: AccessLevel): boolean => {
    if (!rolePermissions) return false;

    const userLevel = rolePermissions[resource];
    return hasPermission(userLevel, level);
  };

  /**
   * Check if user can read a resource
   */
  const canRead = (resource: Resource): boolean => {
    return can(resource, "read");
  };

  /**
   * Check if user can write to a resource
   */
  const canWrite = (resource: Resource): boolean => {
    return can(resource, "write");
  };

  /**
   * Check if user has ANY access to a resource (read or write)
   */
  const canAccess = (resource: Resource): boolean => {
    if (!rolePermissions) return false;
    return rolePermissions[resource] !== "none";
  };

  /**
   * Get user's permission level for a resource
   */
  const getPermissionLevel = (resource: Resource): AccessLevel => {
    if (!rolePermissions) return "none";
    return rolePermissions[resource];
  };

  return {
    userRole,
    rolePermissions,
    can,
    canRead,
    canWrite,
    canAccess,
    getPermissionLevel,
    isProfessional: isProfessionalRole(userRole),
  };
};

/**
 * Hook to check a specific permission
 * Returns boolean for use in conditional rendering
 */
export const useHasPermission = (
  resource: Resource,
  level: AccessLevel
): boolean => {
  const { can } = usePermissions();
  return can(resource, level);
};

/**
 * Hook to check read permission
 */
export const useCanRead = (resource: Resource): boolean => {
  const { canRead } = usePermissions();
  return canRead(resource);
};

/**
 * Hook to check write permission
 */
export const useCanWrite = (resource: Resource): boolean => {
  const { canWrite } = usePermissions();
  return canWrite(resource);
};
