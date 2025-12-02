import { Timestamp } from "firebase/firestore";

// Plan tiers
export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise';

// Subscription status
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'inactive';

// Billing intervals
export type BillingInterval = 'monthly' | 'annual';

// Plan configuration with limits
export interface IPlanConfig {
  tier: PlanTier;
  name: string;
  maxCustomers: number;
  monthlyPrice: number;
  annualPrice: number; // With 20% discount already applied
  features: string[];
}

export const PLAN_CONFIGS: Record<PlanTier, IPlanConfig> = {
  free: {
    tier: 'free',
    name: 'Gratuito',
    maxCustomers: 50,
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Até 50 pacientes',
      'Consultas ilimitadas',
      'Anamnese completa',
      'Gestão financeira básica',
      'Composição corporal',
    ],
  },
  starter: {
    tier: 'starter',
    name: 'Iniciante',
    maxCustomers: 200,
    monthlyPrice: 79,
    annualPrice: 758.40, // 79 * 12 * 0.8
    features: [
      'Até 200 pacientes',
      'Tudo do plano Gratuito',
      '1 colaborador',
      'Suporte por email',
      'Backup automático',
    ],
  },
  professional: {
    tier: 'professional',
    name: 'Profissional',
    maxCustomers: 500,
    monthlyPrice: 149,
    annualPrice: 1430.40, // 149 * 12 * 0.8
    features: [
      'Até 500 pacientes',
      'Tudo do plano Iniciante',
      'Até 5 colaboradores',
      'Suporte prioritário',
      'Relatórios avançados',
      'Personalização visual',
    ],
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Corporativo',
    maxCustomers: Infinity,
    monthlyPrice: 299,
    annualPrice: 2870.40, // 299 * 12 * 0.8
    features: [
      'Pacientes ilimitados',
      'Tudo do plano Profissional',
      'Colaboradores ilimitados',
      'Suporte dedicado',
      'Integrações personalizadas',
      'API de acesso',
    ],
  },
};

// Firebase version (Firestore) - uses Timestamp
export interface ISubscriptionFirebase {
  planTier: PlanTier;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  mercadoPagoSubscriptionId?: string;
  mercadoPagoCustomerId?: string;
  paymentMethod?: 'pix' | 'credit_card' | 'boleto';
  lastPaymentStatus?: 'approved' | 'pending' | 'rejected';
  lastPaymentDate?: Timestamp;
  nextBillingDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// App version - uses ISO date strings
export interface ISubscription {
  planTier: PlanTier;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  mercadoPagoSubscriptionId?: string;
  mercadoPagoCustomerId?: string;
  paymentMethod?: 'pix' | 'credit_card' | 'boleto';
  lastPaymentStatus?: 'approved' | 'pending' | 'rejected';
  lastPaymentDate?: string;
  nextBillingDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Invoice - Firebase version
export interface IInvoiceFirebase {
  id?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'pix' | 'boleto' | 'credit_card';
  mercadoPagoPaymentId?: string;
  pdfUrl?: string;
  dueDate: Timestamp;
  paidAt?: Timestamp;
  createdAt: Timestamp;
}

// Invoice - App version
export interface IInvoice {
  id?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'pix' | 'boleto' | 'credit_card';
  mercadoPagoPaymentId?: string;
  pdfUrl?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

// Payment history - Firebase version
export interface IPaymentHistoryFirebase {
  id?: string;
  event: 'subscription_created' | 'payment_succeeded' | 'payment_failed' | 'upgraded' | 'downgraded' | 'canceled';
  planTier?: PlanTier;
  amount?: number;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

// Payment history - App version
export interface IPaymentHistory {
  id?: string;
  event: 'subscription_created' | 'payment_succeeded' | 'payment_failed' | 'upgraded' | 'downgraded' | 'canceled';
  planTier?: PlanTier;
  amount?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
