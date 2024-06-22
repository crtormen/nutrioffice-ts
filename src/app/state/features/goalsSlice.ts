import { createSelector } from "@reduxjs/toolkit";

import { GoalsService } from "@/app/services/GoalsService";
import { IGoal } from "@/domain/entities";

import { firestoreApi } from "../firestoreApi";

type args = {
  uid: string;
  customerId: string;
};

export const goalsSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["Goals"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchGoals: builder.query<IGoal[], args>({
        providesTags: ["Goals"],
        keepUnusedDataFor: 3600,
        queryFn: async ({ uid, customerId }) => {
          if (!uid || !customerId) return { error: "Args not provided" };

          try {
            const querySnapshot = await GoalsService(
              uid,
              customerId,
            )?.getAllOnce();
            const goals: IGoal[] = [];

            querySnapshot?.forEach((doc) => {
              goals.push({
                id: doc.id,
                ...doc.data(),
              });
            });

            return {
              data: goals,
            };
          } catch (err) {
            return { error: err };
          }
        },
      }),
    }),
  });

export const { useFetchGoalsQuery } = goalsSlice;

export const selectGoals = (uid: string, customerId: string) =>
  createSelector(
    goalsSlice.endpoints.fetchGoals.select({ uid, customerId }),
    ({ data: goals }) => (goals ? goals[0] : undefined),
  );
