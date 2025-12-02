import { EntityId } from "@reduxjs/toolkit";
import { ISubscription } from "./subscription";

export const abilities = [
  "PROFESSIONAL",
  "COLLABORATOR",
  "SECRETARY",
  "MARKETING",
  "FINANCES",
  "ADMIN",
] as const;

export type Abilities = (typeof abilities)[number];

export const ABILITIES: Record<Abilities, { text: string; value: string }> = {
  PROFESSIONAL: { text: "Profissional", value: "professional" },
  COLLABORATOR: { text: "Colaborador", value: "collaborator" },
  SECRETARY: { text: "Secretária", value: "secretary" },
  MARKETING: { text: "Marketing", value: "marketing" },
  FINANCES: { text: "Financeiro", value: "finances" },
  ADMIN: { text: "Administrador", value: "admin" },
};

export interface IContributor {
  name: string;
  email: string;
  phone: string;
  roles: Abilities;
}

export interface IContributors {
  [uid: string]: IContributor | undefined;
}

export interface IUser {
  id?: EntityId;
  // displayName?: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  createdAt?: string;
  roles?: {
    ability: Abilities;
  };
  avatarUrl?: string;
  clinicName?: string;
  specialty?: string;
  licenseNumber?: string;
  bio?: string;
  website?: string;
  whatsapp?: string;
  contributesTo?: string;
  contributors?: IContributors;

  // Subscription system fields
  subscription?: ISubscription;
  permanentFree?: boolean;  // For special accounts (e.g., wife's account)
  currentCustomerCount?: number;  // Cached count for quick limit checks
  // isActive
  // plan
  // payments
  // provider data
}
