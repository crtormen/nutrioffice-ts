import { Timestamp } from "firebase/firestore";

export const LEAD_SOURCES = [
  "whatsapp",
  "instagram",
  "site",
  "indicacao",
  "outro",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export interface ILeadFirebase {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  chatwootContactId?: number;
  chatwootConversationId?: number;
  chatwootInboxId?: number;
  funnelId: string;
  stage: string;
  tags: string[];
  notes?: string;
  source: LeadSource;
  interest?: string;
  isConverted: boolean;
  convertedAt?: Timestamp;
  convertedToCustomerId?: string;
  lastPurchaseDate?: Timestamp;
  lastAppointmentDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ILead {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  chatwootContactId?: number;
  chatwootConversationId?: number;
  chatwootInboxId?: number;
  funnelId: string;
  stage: string;
  tags: string[];
  notes?: string;
  source: LeadSource;
  interest?: string;
  isConverted: boolean;
  convertedAt?: string;
  convertedToCustomerId?: string;
  lastPurchaseDate?: string;
  lastAppointmentDate?: string;
  createdAt: string;
  updatedAt: string;
}
