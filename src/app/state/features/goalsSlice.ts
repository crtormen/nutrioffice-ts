/* eslint-disable camelcase */
import { createSelector } from "@reduxjs/toolkit";
import { parse } from "date-fns";
import {
  type DocumentData,
  type PartialWithFieldValue,
  Timestamp,
} from "firebase/firestore";

import { GoalsService } from "@/app/services/GoalsService";
import { IGoal, type IGoalFirebase } from "@/domain/entities";
import { dateInString } from "@/lib/utils";

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
      addGoal: builder.mutation<
        IGoal,
        {
          uid: string | undefined;
          customerId: string | undefined;
          newGoal: IGoal;
        }
      >({
        invalidatesTags: ["Goals"],
        queryFn: async ({ uid, customerId, newGoal }) => {
          if (!uid || !customerId) return { error: "Args not provided" };

          const {
            createdAt = "",
            endDate = "",
            firstConsulta_id = "",
            lastConsulta_id = "",
            params = {},
          } = newGoal;

          const goal: IGoalFirebase = {
            createdAt: createdAt
              ? Timestamp.fromDate(parse(createdAt, "dd/MM/yyyy", new Date()))
              : Timestamp.fromDate(new Date()),
            endDate: endDate
              ? Timestamp.fromDate(parse(endDate, "dd/MM/yyyy", new Date()))
              : undefined,
            firstConsulta_id,
            lastConsulta_id,
            params,
          };

          try {
            const response = await GoalsService(uid, customerId)?.addOne(goal);
            const data = response?.withConverter({
              toFirestore({
                ...data
              }: PartialWithFieldValue<IGoal>): DocumentData {
                return data;
              },
              fromFirestore(snapshot, options): IGoal {
                const data = snapshot.data(options);
                return {
                  id: snapshot.id,
                  ...data,
                  endDate: dateInString(data.endDate),
                  createdAt: dateInString(data.createdAt),
                };
              },
            });
            return { data };
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
    }),
  });

export const { useFetchGoalsQuery, useAddGoalMutation } = goalsSlice;

export const selectGoals = (uid: string, customerId: string) =>
  createSelector(
    goalsSlice.endpoints.fetchGoals.select({ uid, customerId }),
    ({ data: goals }) => (goals ? goals[0] : undefined),
  );
