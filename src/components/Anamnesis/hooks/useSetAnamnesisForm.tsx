import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";

import { useAppSelector } from "@/app/state";
import {
  selectAnamnesisSettings,
  useFetchSettingsQuery,
} from "@/app/state/features/settingsSlice";
import {
  getEnabledFieldsForType,
  useFetchAnamnesisTokensQuery,
} from "@/app/state/features/anamnesisTokensSlice";
import { useGetCustomerData } from "@/components/Customers/hooks";
import { zodType } from "@/components/form";
import { AMBOS } from "@/domain/entities";
import { AppointmentType } from "@/domain/entities/formSubmission";
import { useAuth } from "@/infra/firebase";

export const useSetAnamnesisForm = (appointmentType?: AppointmentType) => {
  const { customerId } = useParams();
  const { dbUid } = useAuth();
  const { refetch } = useFetchSettingsQuery(dbUid);
  const selectSettings = useMemo(() => selectAnamnesisSettings(dbUid), [dbUid]);
  const anamnesisFields = useAppSelector(selectSettings);
  const customer = useGetCustomerData(customerId);

  const { data: tokensData, isLoading: isLoadingTokens, isFetching: isFetchingTokens } = useFetchAnamnesisTokensQuery(dbUid ?? "", {
    skip: !dbUid || !appointmentType,
  });

  const enabledFields = useMemo(
    () => (appointmentType ? getEnabledFieldsForType(tokensData, appointmentType) : null),
    [tokensData, appointmentType],
  );

  useEffect(() => {
    if (!anamnesisFields || Object.keys(anamnesisFields).length === 0) {
      refetch();
    }
  }, [refetch, dbUid, anamnesisFields]);

  const anamnesisFieldArray = useMemo(() => {
    const byGender = Object.entries(anamnesisFields).filter(
      ([, values]) =>
        !values.gender ||
        values.gender === AMBOS ||
        values.gender === customer?.gender,
    );

    if (!appointmentType || !enabledFields || enabledFields.length === 0) {
      return byGender;
    }

    return enabledFields
      .filter((id) => id in anamnesisFields)
      .map((id) => [id, anamnesisFields[id]] as [string, typeof anamnesisFields[string]])
      .filter(([, values]) =>
        !values.gender ||
        values.gender === AMBOS ||
        values.gender === customer?.gender,
      );
  }, [anamnesisFields, customer?.gender, appointmentType, enabledFields]);

  const mapFieldsToZod =
    anamnesisFieldArray &&
    (anamnesisFieldArray.map(([key, value]) => [key, zodType(value)]) as [
      key: string,
      fieldType: z.ZodSchema,
    ][]);

  const zodSchema =
    mapFieldsToZod && z.object(Object.fromEntries(mapFieldsToZod));

  const isLoadingForm = isLoadingTokens || isFetchingTokens;

  return { customerName: customer?.name, anamnesisFieldArray, zodSchema, isLoadingForm };
};
