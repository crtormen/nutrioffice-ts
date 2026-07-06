import { useCallback, useMemo } from "react";
import { deleteField, doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/app/state";
import { firestoreApi } from "@/app/state/firestoreApi";
import {
  selectCustomAnamnesisSettings,
  selectDefaultAnamnesisSettings,
} from "@/app/state/features/settingsSlice";
import { FieldValuesSetting } from "@/domain/entities";
import { db, useAuth } from "@/infra/firebase";

import { newAnamnesisFieldFormInputs } from "./useAnamnesisFieldForm";

export const useSetAnamnesisField = (
  setDialogOpen: (isOpen: boolean) => void,
) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const selectCustom = useMemo(() => selectCustomAnamnesisSettings(user?.uid), [user?.uid]);
  const customAnamnesisFields = useAppSelector(selectCustom);
  const selectDefault = useMemo(() => selectDefaultAnamnesisSettings(user?.uid), [user?.uid]);
  const defaultAnamnesisFields = useAppSelector(selectDefault);

  const handleSubmitAnamnesisField = useCallback(
    (
      data: newAnamnesisFieldFormInputs,
      fieldToEdit?: FieldValuesSetting,
      fieldType?: string,
    ) => {
      if (!user?.uid) return;
      let options = {};
      data.options.forEach((item) => {
        if (item.option.length === 0) return; // empty string added

        options = {
          ...options,
          [item.optionId]: item.option,
        };
      });

      const targetType = fieldType || "custom";
      const existingFields = targetType === "default" ? defaultAnamnesisFields : customAnamnesisFields;

      const fieldId = fieldToEdit
        ? fieldToEdit.name
        : customAnamnesisFields
          ? "custom" + Object.keys(customAnamnesisFields).length
          : "custom0";

      // Use dotted field paths with updateDoc so deleteField() works correctly at nested depth.
      // setDoc with merge:true silently ignores deleteField() inside nested objects.
      const docRef = doc(db, `users/${user.uid}/settings/${targetType}`);
      const prefix = `anamnesis.${fieldId}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatePayload: Record<string, any> = {
        [`${prefix}.label`]: data.label,
        [`${prefix}.placeholder`]: data.placeholder ?? "",
        [`${prefix}.type`]: data.type,
        [`${prefix}.gender`]: data.gender,
        [`${prefix}.options`]: options,
        [`${prefix}.name`]: fieldId,
        [`${prefix}.rules`]: data.required ? { required: true } : deleteField(),
      };

      updateDoc(docRef, updatePayload)
        .then(() => {
          dispatch(firestoreApi.util.invalidateTags(["Settings"]));
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
    [user, customAnamnesisFields, defaultAnamnesisFields, dispatch, setDialogOpen],
  );

  return { handleSubmitAnamnesisField };
};
