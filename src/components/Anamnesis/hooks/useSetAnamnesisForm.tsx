import { useParams } from "react-router-dom";
import { z } from "zod";

import { useAppSelector } from "@/app/state";
import { selectAnamnesisSettings } from "@/app/state/features/settingsSlice";
import { useGetCustomerData } from "@/components/Customers/hooks";
import { zodType } from "@/components/form";
import { useAuth } from "@/infra/firebase";

export const useSetAnamnesisForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const anamnesisFields = useAppSelector(selectAnamnesisSettings(user?.uid));
  const customer = useGetCustomerData(id);

  if (!anamnesisFields) return {};

  const anamnesisFieldArray = Object.entries(anamnesisFields).filter(
    ([, values]) =>
      !values.gender ||
      values.gender === "B" ||
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
