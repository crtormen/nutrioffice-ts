/**
 * Permission System Entities
 * Defines granular permissions for different roles
 */

import { Abilities } from "./user";

// Available resources/features in the system
export const resources = [
  "customers",
  "consultas",
  "anamnesis",
  "finances",
  "analytics",
  "settings",
] as const;

export type Resource = (typeof resources)[number];

// Access levels for each resource
export const accessLevels = ["none", "read", "write"] as const;

export type AccessLevel = (typeof accessLevels)[number];

// Human-readable labels
export const RESOURCES: Record<Resource, { text: string; description: string }> = {
  customers: {
    text: "Pacientes",
    description: "Gerenciar dados de pacientes",
  },
  consultas: {
    text: "Consultas",
    description: "Agendar e gerenciar consultas",
  },
  anamnesis: {
    text: "Anamnese",
    description: "Criar e editar fichas de anamnese",
  },
  finances: {
    text: "Financeiro",
    description: "Visualizar e gerenciar pagamentos",
  },
  analytics: {
    text: "Relatórios",
    description: "Visualizar relatórios e análises",
  },
  settings: {
    text: "Configurações",
    description: "Alterar configurações do sistema",
  },
};

export const ACCESS_LEVELS: Record<AccessLevel, { text: string; color: string }> = {
  none: { text: "Sem acesso", color: "text-muted-foreground" },
  read: { text: "Somente leitura", color: "text-blue-600" },
  write: { text: "Leitura e escrita", color: "text-green-600" },
};

// Permissions map for a specific role
export type RolePermissions = Record<Resource, AccessLevel>;

// All role permissions for an organization
export interface PermissionsConfig {
  rolePermissions: Partial<Record<Abilities, RolePermissions>>;
  updatedAt?: string;
}

// Default permissions for each role
export const DEFAULT_PERMISSIONS: Record<Abilities, RolePermissions> = {
  PROFESSIONAL: {
    customers: "write",
    consultas: "write",
    anamnesis: "write",
    finances: "write",
    analytics: "write",
    settings: "write",
  },
  ADMIN: {
    customers: "write",
    consultas: "write",
    anamnesis: "write",
    finances: "write",
    analytics: "write",
    settings: "write",
  },
  COLLABORATOR: {
    customers: "write",
    consultas: "write",
    anamnesis: "write",
    finances: "none",
    analytics: "read",
    settings: "none",
  },
  SECRETARY: {
    customers: "write",
    consultas: "write",
    anamnesis: "read",
    finances: "read",
    analytics: "read",
    settings: "none",
  },
  MARKETING: {
    customers: "read",
    consultas: "read",
    anamnesis: "none",
    finances: "none",
    analytics: "write",
    settings: "none",
  },
  FINANCES: {
    customers: "read",
    consultas: "read",
    anamnesis: "none",
    finances: "write",
    analytics: "read",
    settings: "none",
  },
};

// Helper to check if user has permission
export const hasPermission = (
  permission: AccessLevel | undefined,
  requiredLevel: AccessLevel
): boolean => {
  if (!permission) return false;

  const levels: AccessLevel[] = ["none", "read", "write"];
  const userLevelIndex = levels.indexOf(permission);
  const requiredLevelIndex = levels.indexOf(requiredLevel);

  return userLevelIndex >= requiredLevelIndex;
};
