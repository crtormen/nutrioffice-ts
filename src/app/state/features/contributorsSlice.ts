import {
  ContributorsService,
  type IContributorWithId,
} from "@/app/services/ContributorsService";
import { IContributor } from "@/domain/entities";

import { firestoreApi } from "../firestoreApi";

/**
 * Contributors Slice
 * Manages contributors with real-time Firestore subscription
 */
export const contributorsSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["Contributors"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      /**
       * Fetch contributors with real-time updates
       */
      fetchContributors: builder.query<IContributorWithId[], string>({
        providesTags: ["Contributors"],
        queryFn: () => ({ data: [] }), // Initial empty state

        async onCacheEntryAdded(
          uid,
          { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
        ) {
          let unsubscribe: (() => void) | undefined;

          try {
            // Wait for the initial query to resolve
            await cacheDataLoaded;

            // Subscribe to real-time updates
            const service = ContributorsService(uid);
            if (!service) {
              console.warn("ContributorsService not available for uid:", uid);
              return;
            }

            unsubscribe = service.getAll((snapshot) => {
              updateCachedData(() => {
                const contributors: IContributorWithId[] = [];
                snapshot.forEach((doc) => {
                  contributors.push(doc.data() as IContributorWithId);
                });
                return contributors;
              });
            });
          } catch (error) {
            console.error("Error in fetchContributors subscription:", error);
          }

          // Cleanup subscription on cache removal
          await cacheEntryRemoved;
          unsubscribe?.();
        },
      }),

      /**
       * Update contributor
       */
      updateContributor: builder.mutation<
        void,
        { uid: string; contributorId: string; data: Partial<IContributor> }
      >({
        invalidatesTags: ["Contributors"],
        queryFn: async ({ uid, contributorId, data }) => {
          try {
            const service = ContributorsService(uid);
            if (!service) {
              return { error: "Service not available" };
            }

            await service.updateOne(contributorId, data);
            return { data: undefined };
          } catch (error: any) {
            return {
              error: error.message || "Failed to update contributor",
            };
          }
        },
      }),

      /**
       * Remove contributor
       */
      removeContributor: builder.mutation<
        void,
        { uid: string; contributorId: string }
      >({
        invalidatesTags: ["Contributors"],
        queryFn: async ({ uid, contributorId }) => {
          try {
            const service = ContributorsService(uid);
            if (!service) {
              return { error: "Service not available" };
            }

            await service.deleteOne(contributorId);
            return { data: undefined };
          } catch (error: any) {
            return {
              error: error.message || "Failed to remove contributor",
            };
          }
        },
      }),
    }),
  });

// Export hooks
export const {
  useFetchContributorsQuery,
  useUpdateContributorMutation,
  useRemoveContributorMutation,
} = contributorsSlice;
