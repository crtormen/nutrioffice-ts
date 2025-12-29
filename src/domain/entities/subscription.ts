import { Timestamp } from "firebase/firestore";

// Plan tiers
export const PLAN_TIERS = {
  FREE: 'free',
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
} as const;

export type PlanTier = typeof PLAN_TIERS[keyof typeof PLAN_TIERS];

// Subscription status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  INACTIVE: 'inactive',
} as const;

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];

// Billing intervals
export const BILLING_INTERVALS = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
} as const;

export type BillingInterval = typeof BILLING_INTERVALS[keyof typeof BILLING_INTERVALS];

// Subscription payment methods
export const SUBSCRIPTION_PAYMENT_METHODS = {
  PIX: 'pix',
  CREDIT_CARD: 'credit_card',
  BOLETO: 'boleto',
} as const;

export type SubscriptionPaymentMethod = typeof SUBSCRIPTION_PAYMENT_METHODS[keyof typeof SUBSCRIPTION_PAYMENT_METHODS];

// Payment status
export const PAYMENT_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Invoice status
export const INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

// Payment history events
export const PAYMENT_EVENTS = {
  SUBSCRIPTION_CREATED: 'subscription_created',
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  PAYMENT_FAILED: 'payment_failed',
  UPGRADED: 'upgraded',
  DOWNGRADED: 'downgraded',
  CANCELED: 'canceled',
} as const;

export type PaymentEvent = typeof PAYMENT_EVENTS[keyof typeof PAYMENT_EVENTS];

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
  [PLAN_TIERS.FREE]: {
    tier: PLAN_TIERS.FREE,
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
  [PLAN_TIERS.STARTER]: {
    tier: PLAN_TIERS.STARTER,
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
  [PLAN_TIERS.PROFESSIONAL]: {
    tier: PLAN_TIERS.PROFESSIONAL,
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
  [PLAN_TIERS.ENTERPRISE]: {
    tier: PLAN_TIERS.ENTERPRISE,
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
  paymentMethod?: SubscriptionPaymentMethod;
  lastPaymentStatus?: PaymentStatus;
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
  paymentMethod?: SubscriptionPaymentMethod;
  lastPaymentStatus?: PaymentStatus;
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
  status: InvoiceStatus;
  paymentMethod: SubscriptionPaymentMethod;
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
  status: InvoiceStatus;
  paymentMethod: SubscriptionPaymentMethod;
  mercadoPagoPaymentId?: string;
  pdfUrl?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

// Payment history - Firebase version
export interface IPaymentHistoryFirebase {
  id?: string;
  event: PaymentEvent;
  planTier?: PlanTier;
  amount?: number;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

// Payment history - App version
export interface IPaymentHistory {
  id?: string;
  event: PaymentEvent;
  planTier?: PlanTier;
  amount?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
