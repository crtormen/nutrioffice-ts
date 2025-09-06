import { createSelector } from "@reduxjs/toolkit";

import { SettingsService } from "@/app/services/SettingsService";
import { IAllSettings, ISettings } from "@/domain/entities";

import { firestoreApi } from "../firestoreApi";

type mutationArgs = {
  uid?: string;
  type: string;
  setting: ISettings;
  merge?: boolean;
};

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
      setSettings: builder.mutation<ISettings, mutationArgs>({
        queryFn: async ({ uid, type, setting, merge }) => {
          try {
            await SettingsService(uid)?.setOne(type, setting, merge);
            return { data: setting };
          } catch (error: unknown) {
            return { error };
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
    },
  );
};

export const selectDefaultAnamnesisSettings = (uid: string | undefined) => {
  return createSelector(
    settingsSlice.endpoints.fetchSettings.select(uid),
    ({ data: settings }) => settings?.default?.anamnesis,
  );
};

export const selectCustomAnamnesisSettings = (uid: string | undefined) => {
  return createSelector(
    settingsSlice.endpoints.fetchSettings.select(uid),
    ({ data: settings }) => settings?.custom?.anamnesis,
  );
};

export const { useFetchSettingsQuery, useSetSettingsMutation } = settingsSlice;
