import { createSelector } from "@reduxjs/toolkit";

import { SettingsService } from "@/app/services/SettingsService";
import { IAllSettings, ISettings } from "@/domain/entities";

import { firestoreApi } from "../firestoreApi";

export const settingsSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["Settings"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchSettings: builder.query<IAllSettings, string | undefined>({
        providesTags: ["Settings"],
        keepUnusedDataFor: 3600,
        queryFn: async (uid) => {
          if (!uid) return { data: undefined, error: "Args not provided" };

          try {
            const querySnapshot = await SettingsService(uid)?.getAllOnce();

            let settings: IAllSettings = {};

            querySnapshot?.forEach((doc) => {
              settings = {
                ...settings,
                [doc.id]: doc.data(),
              };
            });

            return {
              data: settings,
            };
          } catch (err) {
            return { error: err };
          }
        },
      }),
      fetchDefaultSettings: builder.query<ISettings, string | undefined>({
        providesTags: ["Settings"],
        keepUnusedDataFor: 3600,
        queryFn: async (uid) => {
          if (!uid) return { data: undefined, error: "Args not provided" };

          try {
            const settings = await SettingsService(uid)?.getOne("default");

            return {
              data: settings,
            };
          } catch (err) {
            return { error: err };
          }
        },
      }),
      fetchCustomSettings: builder.query<ISettings, string | undefined>({
        providesTags: ["Settings"],
        keepUnusedDataFor: 3600,
        queryFn: async (uid) => {
          if (!uid) return { data: undefined, error: "Args not provided" };

          try {
            const settings = await SettingsService(uid)?.getOne("custom");

            return {
              data: settings,
            };
          } catch (err) {
            return { error: err };
          }
        },
      }),
    }),
  });

export const selectAnamnesisSettings = (uid: string | undefined) => {
  return createSelector(
    settingsSlice.endpoints.fetchSettings.select(uid),
    ({ data: settings }) => {
      return {
        ...settings?.default?.anamnesis,
        ...settings?.custom?.anamnesis,
      };
      // settings?.anamnesis
    },
  );
};

export const {
  useFetchSettingsQuery,
  useFetchDefaultSettingsQuery,
  useFetchCustomSettingsQuery,
} = settingsSlice;
