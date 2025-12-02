import { firestoreApi } from "../firestoreApi";
import { ThemeService } from "@/app/services/ThemeService";
import { ThemeConfig } from "@/domain/entities";

/**
 * Theme Slice
 * Manages theme configuration via RTK Query
 */
export const themeSlice = firestoreApi
  .enhanceEndpoints({ addTagTypes: ["Theme"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      /**
       * Fetch theme configuration
       */
      fetchTheme: builder.query<ThemeConfig, string>({
        providesTags: ["Theme"],
        queryFn: async (uid) => {
          try {
            const service = ThemeService(uid);
            if (!service) {
              return { error: "Service not available" };
            }

            const theme = await service.get();
            return { data: theme };
          } catch (error: any) {
            return { error: error.message || "Failed to fetch theme" };
          }
        },
      }),

      /**
       * Update theme configuration
       */
      updateTheme: builder.mutation<
        void,
        { uid: string; theme: Partial<ThemeConfig> }
      >({
        invalidatesTags: ["Theme"],
        queryFn: async ({ uid, theme }) => {
          try {
            const service = ThemeService(uid);
            if (!service) {
              return { error: "Service not available" };
            }

            await service.update(theme);
            return { data: undefined };
          } catch (error: any) {
            return { error: error.message || "Failed to update theme" };
          }
        },
      }),

      /**
       * Reset theme to defaults
       */
      resetTheme: builder.mutation<void, string>({
        invalidatesTags: ["Theme"],
        queryFn: async (uid) => {
          try {
            const service = ThemeService(uid);
            if (!service) {
              return { error: "Service not available" };
            }

            await service.reset();
            return { data: undefined };
          } catch (error: any) {
            return { error: error.message || "Failed to reset theme" };
          }
        },
      }),
    }),
  });

export const {
  useFetchThemeQuery,
  useUpdateThemeMutation,
  useResetThemeMutation,
} = themeSlice;
