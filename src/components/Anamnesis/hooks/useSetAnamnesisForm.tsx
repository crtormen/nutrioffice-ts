import { z } from "zod";

import { useAppSelector } from "@/app/state";
import { selectAnamnesisSettings } from "@/app/state/features/settingsSlice";
import { zodType } from "@/components/form";
import { useAuth } from "@/infra/firebase";

export const useSetAnamnesisForm = () => {
  const { user } = useAuth();
  const anamnesisFields = useAppSelector(selectAnamnesisSettings(user?.uid));

  if (!anamnesisFields) return {};

  const anamnesisFieldArray = Object.entries(anamnesisFields);

  const mapFieldsToZod =
    anamnesisFieldArray &&
    (anamnesisFieldArray.map(([key, value]) => [key, zodType(value)]) as [
      key: string,
      fieldType: z.ZodSchema,
    ][]);

  const zodSchema =
    mapFieldsToZod && z.object(Object.fromEntries(mapFieldsToZod));

  return { anamnesisFieldArray, zodSchema };
};
