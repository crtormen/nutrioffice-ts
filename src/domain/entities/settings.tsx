import { FormInputProps } from "@/components/form";

export const genders = ["H", "M", "B"] as const;
export type Gender = (typeof genders)[number];

export type FieldValuesSetting = {
  label: string;
  description?: string;
  error_message?: string;
  gender?: Gender;
} & FormInputProps;

export type FieldSetting = Record<string, FieldValuesSetting>;

export interface ISettings {
  anamnesis: FieldSetting;
}

export interface IAllSettings {
  custom?: ISettings;
  default?: ISettings;
}

export const GENDERS: Record<Gender, { text: string; value: string }> = {
  H: { text: "Homem", value: "H" },
  M: { text: "Mulher", value: "M" },
  B: { text: "Geral", value: "B" },
};
