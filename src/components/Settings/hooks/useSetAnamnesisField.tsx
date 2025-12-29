import { useCallback } from "react";
import { toast } from "sonner";

import { useAppSelector } from "@/app/state";
import {
  selectCustomAnamnesisSettings,
  useSetSettingsMutation,
} from "@/app/state/features/settingsSlice";
import { FieldValuesSetting, ISettings } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

import { newAnamnesisFieldFormInputs } from "./useAnamnesisFieldForm";

export const useSetAnamnesisField = (
  setDialogOpen: (isOpen: boolean) => void,
) => {
  const { user } = useAuth();
  const anamnesisFields = useAppSelector(
    selectCustomAnamnesisSettings(user?.uid),
  );
  const [updateCustomSettings] = useSetSettingsMutation();

  const handleSubmitAnamnesisField = useCallback(
    (
      data: newAnamnesisFieldFormInputs,
      fieldToEdit?: FieldValuesSetting,
      fieldType?: string,
    ) => {
      let options = {};
      data.options.forEach((item) => {
        if (item.option.length === 0) return; // empty string added

        options = {
          ...options,
          [item.optionId]: item.option,
        };
      });

      const fieldId = fieldToEdit
        ? fieldToEdit.name
        : anamnesisFields
          ? "custom" + Object.keys(anamnesisFields).length
          : "custom0";

      const updatedSettingsData: Partial<ISettings> = {
        anamnesis: {
          ...anamnesisFields,
          [fieldId]: {
            label: data.label,
            placeholder: data.placeholder,
            type: data.type,
            gender: data.gender,
            options,
            name: fieldId,
          },
        },
      };
      updateCustomSettings({
        uid: user?.uid,
        type: fieldType || "custom",
        setting: updatedSettingsData,
        merge: true,
      })
        .then(() => {
          setDialogOpen(false);
          toast.success("Campo cadastrado com sucesso");
        })
        .catch((error: unknown) => {
          console.error(error);
          toast.error(
            "Um erro ocorreu durante o cadastro do campo. Tente novamente",
          );
        });
    },
    [],
  );

  return { handleSubmitAnamnesisField };
};
