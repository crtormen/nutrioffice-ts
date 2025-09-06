import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { inputTypes } from "@/components/form";
import { FieldValuesSetting, Gender, genders } from "@/domain/entities";

export const newAnamnesisFieldValidationSchema = z.object({
  label: z.string().min(1, "Informe a pergunta do campo"),
  type: z.enum(inputTypes),
  placeholder: z.string().optional(),
  gender: z.enum(genders),
  options: z.array(
    z.object({
      option: z.string(),
      optionId: z.string(),
    }),
  ),
});

export type newAnamnesisFieldFormInputs = z.infer<
  typeof newAnamnesisFieldValidationSchema
>;

const adjustFieldEdittingProps = (
  fieldToEdit?: FieldValuesSetting,
): newAnamnesisFieldFormInputs | undefined => {
  if (!fieldToEdit) return undefined;

  const options =
    fieldToEdit.options &&
    Object.entries(fieldToEdit.options).map(([key, value]) => ({
      option: value,
      optionId: key,
    }));

  const gender =
    fieldToEdit.gender && genders.includes(fieldToEdit.gender as Gender)
      ? (fieldToEdit.gender as Gender)
      : ("B" as Gender);

  const fieldProps: newAnamnesisFieldFormInputs = {
    options: options || [{ option: "", optionId: "" }],
    label: fieldToEdit.label,
    placeholder: fieldToEdit.placeholder,
    gender,
    type: fieldToEdit.type,
  };

  return fieldProps;
};

export const useAnamnesisFieldForm = (fieldToEdit?: FieldValuesSetting) => {
  const fieldProps = adjustFieldEdittingProps(fieldToEdit);
  return useForm<newAnamnesisFieldFormInputs>({
    resolver: zodResolver(newAnamnesisFieldValidationSchema),
    defaultValues: {
      label: "",
      placeholder: "",
      gender: "B",
      type: "text",
      options: [{ option: "", optionId: "" }],
    },
    values: fieldProps
      ? {
          label: fieldProps.label,
          placeholder: fieldProps.placeholder,
          options: fieldProps.options,
          gender: fieldProps.gender,
          type: fieldProps.type!,
          // rules: fieldToEdit.rules,
        }
      : undefined,
  });
};
