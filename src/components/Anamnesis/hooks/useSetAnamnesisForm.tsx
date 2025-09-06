import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";

import { useAppSelector } from "@/app/state";
import {
  selectAnamnesisSettings,
  useFetchSettingsQuery,
} from "@/app/state/features/settingsSlice";
import { useGetCustomerData } from "@/components/Customers/hooks";
import { zodType } from "@/components/form";
import { AMBOS } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

export const useSetAnamnesisForm = () => {
  const { customerId } = useParams();
  const { user } = useAuth();
  const { refetch } = useFetchSettingsQuery(user?.uid);
  const anamnesisFields = useAppSelector(selectAnamnesisSettings(user?.uid));
  const customer = useGetCustomerData(customerId);

  useEffect(() => {
    if (!anamnesisFields || Object.keys(anamnesisFields).length === 0) {
      refetch();
    }
  }, [refetch, user, anamnesisFields]);

  const anamnesisFieldArray = Object.entries(anamnesisFields).filter(
    ([, values]) =>
      !values.gender ||
      values.gender === AMBOS ||
      values.gender === customer?.gender,
  );

  const mapFieldsToZod =
    anamnesisFieldArray &&
    (anamnesisFieldArray.map(([key, value]) => [key, zodType(value)]) as [
      key: string,
      fieldType: z.ZodSchema,
    ][]);

  const zodSchema =
    mapFieldsToZod && z.object(Object.fromEntries(mapFieldsToZod));

  return { customerName: customer?.name, anamnesisFieldArray, zodSchema };
};
