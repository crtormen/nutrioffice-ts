import { FormInputProps } from "@/components/form";

export const genders = ["H", "M", "B"] as const;
export type Gender = (typeof genders)[number];

export type FieldValuesSetting = {
  label: string;
  description?: string;
  error_message?: string;
  gender?: Gender;
  order?: number;
} & FormInputProps;

export type FieldSetting = Record<string, FieldValuesSetting>;

export const serviceCategories = [
  "consulta",
  "time",
] as const;
export type ServiceCategory = (typeof serviceCategories)[number];

export interface IServiceConfig {
  id: string;
  name: string;
  description?: string;
  price: number;
  credits?: number;
  active: boolean;
  category: ServiceCategory;
  createdAt?: string;
}

export type ServiceSetting = Record<string, IServiceConfig>;

export interface ISettings {
  anamnesis: FieldSetting;
  services: ServiceSetting;
}

export interface IAllSettings {
  custom?: ISettings;
  default?: ISettings;
  crm?: import("./crm").ICrmSettings;
}

export const SERVICE_CATEGORIES: Record<
  ServiceCategory,
  { text: string; value: string }
> = {
  consulta: { text: "Consulta", value: "consulta" },
  time: { text: "Meses", value: "time" },
};

export const GENDERS: Record<Gender, { text: string; value: string }> = {
  H: { text: "Homem", value: "H" },
  M: { text: "Mulher", value: "M" },
  B: { text: "Geral", value: "B" },
};
