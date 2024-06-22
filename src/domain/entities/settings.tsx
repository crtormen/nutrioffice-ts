import { FormInputProps } from "@/components/form";

export type FieldValuesSetting = {
  label: string;
  description?: string;
  error_message?: string;
} & FormInputProps;

export type FieldSetting = Record<string, FieldValuesSetting>;

export interface ISettings {
  anamnesis: FieldSetting;
}

export interface IAllSettings {
  custom?: ISettings;
  default?: ISettings;
}
