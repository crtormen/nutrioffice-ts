import { firestoreApi } from "../firestoreApi";
import {
  PermissionsService,
} from "@/app/services/PermissionsService";
import {
  PermissionsConfig,
  Abilities,
  RolePermissions,
} from "@/domain/entities";

/**
 * Permissions Slice
 * Manages role-based permissions via RTK Query
 */
export const permissionsSlice = firestoreApi
  .enhanceEndpoints({ addTagTypes: ["Permissions"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      /**
       * Fetch permissions configuration
       */
      fetchPermissions: builder.query<PermissionsConfig, string>({
        providesTags: ["Permissions"],
        queryFn: async (uid) => {
          try {
            const service = PermissionsService(uid);
            if (!service) {
              return { error: "Service not available" };
            }

            const permissions = await service.get();
            return { data: permissions };
          } catch (error: any) {
            return { error: error.message || "Failed to fetch permissions" };
          }
        },
      }),

      /**
       * Fetch permissions for a specific role
       */
      fetchRolePermissions: builder.query<
        RolePermissions,
        { uid: string; role: Abilities }
      >({
        providesTags: ["Permissions"],
        queryFn: async ({ uid, role }) => {
          try {
            const service = PermissionsService(uid);
            if (!service) {
              return { error: "Service not available" };
            }

            const permissions = await service.getForRole(role);
            return { data: permissions };
          } catch (error: any) {
            return {
              error: error.message || "Failed to fetch role permissions",
            };
          }
        },
      }),

      /**
       * Update permissions configuration
       */
      updatePermissions: builder.mutation<
        void,
        {
          uid: string;
          rolePermissions: Partial<Record<Abilities, RolePermissions>>;
        }
      >({
        invalidatesTags: ["Permissions"],
        queryFn: async ({ uid, rolePermissions }) => {
          try {
            const service = PermissionsService(uid);
            if (!service) {
              return { error: "Service not available" };
            }

            await service.update(rolePermissions);
            return { data: undefined };
          } catch (error: any) {
            return { error: error.message || "Failed to update permissions" };
          }
        },
      }),

      /**
       * Reset permissions to defaults
       */
      resetPermissions: builder.mutation<void, string>({
        invalidatesTags: ["Permissions"],
        queryFn: async (uid) => {
          try {
            const service = PermissionsService(uid);
            if (!service) {
              return { error: "Service not available" };
            }

            await service.reset();
            return { data: undefined };
          } catch (error: any) {
            return { error: error.message || "Failed to reset permissions" };
          }
        },
      }),
    }),
  });

export const {
  useFetchPermissionsQuery,
  useFetchRolePermissionsQuery,
  useUpdatePermissionsMutation,
  useResetPermissionsMutation,
} = permissionsSlice;
