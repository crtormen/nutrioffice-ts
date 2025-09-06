import { EntityId } from "@reduxjs/toolkit";

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
  contributesTo?: string;
  contributors?: IContributors;
  // isActive
  // plan
  // payments
  // provider data
}
