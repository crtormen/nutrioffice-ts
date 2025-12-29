import { EntityId } from "@reduxjs/toolkit";
import { Timestamp } from "firebase/firestore";

// Payment interfaces for the new flat collection structure
export interface IPayment {
  id?: string;
  financeId: string; // Reference to parent finance
  customerId: string; // Denormalized for queries
  createdAt: string; // Payment registration date
  method: string; // PIX, Cartão, Dinheiro, etc
  valor: number; // Payment amount
  obs?: string; // Observations
  hasInstallments: boolean; // True if split into installments
  installmentsCount?: number; // Number of installments (if applicable)
  // Future fields (prepared but not used yet):
  files?: string[]; // Array of file URLs
  processingFee?: number; // Payment gateway fees
  gatewayTransactionId?: string; // External payment ID
}

export interface IPaymentFirebase {
  id?: string;
  financeId: string;
  customerId: string;
  createdAt: Timestamp;
  method: string;
  valor: number;
  obs?: string;
  hasInstallments: boolean;
  installmentsCount?: number;
  files?: string[];
  processingFee?: number;
  gatewayTransactionId?: string;
}

// Installment interfaces for tracking payment installments
export interface IInstallment {
  id?: string;
  paymentId: string; // Reference to parent payment
  financeId: string; // Denormalized for queries
  customerId: string; // Denormalized for queries
  installmentNumber: number; // 1, 2, 3, etc.
  valor: number; // Installment amount
  dueDate: string; // When it should be paid/credited
  status: "pending" | "paid" | "reconciled";
  paidDate?: string; // When manually marked as paid
  bankTransactionId?: string; // Future: linked bank transaction
  obs?: string;
}

export interface IInstallmentFirebase {
  id?: string;
  paymentId: string;
  financeId: string;
  customerId: string;
  installmentNumber: number;
  valor: number;
  dueDate: Timestamp;
  status: "pending" | "paid" | "reconciled";
  paidDate?: Timestamp;
  bankTransactionId?: string;
  obs?: string;
}

export interface IFinanceItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  credits: number;
}

export interface IFinance {
  id?: string;
  customerId: string;
  createdAt?: string;
  items?: IFinanceItem[]; // Services sold (optional for backwards compatibility)
  subtotal: number; // Sum of all items
  discount?: number; // Discount amount
  total: number; // Subtotal - discount
  pago: number; // Amount paid
  saldo: number; // Remaining balance (total - pago)
  creditsGranted: number; // Total credits from this sale
  obs?: string;
  payments?: IPayment[];
  status: "pending" | "partial" | "paid"; // Payment status
}

export interface IFinanceFirebase {
  id?: string;
  customerId: string;
  createdAt?: Timestamp;
  items?: IFinanceItem[]; // Optional for backwards compatibility
  subtotal: number;
  discount?: number;
  total: number;
  pago: number;
  saldo: number;
  creditsGranted: number;
  obs?: string;
  payments?: IPaymentFirebase[];
  status: "pending" | "partial" | "paid";
}

export const PAYMENT_METHODS = [
  { label: "Dinheiro", value: "dinheiro" },
  { label: "Cartão de Crédito", value: "credito" },
  { label: "Cartão de Débito", value: "debito" },
  { label: "PIX", value: "pix" },
  { label: "PIX Programado", value: "pix_programado" },
  { label: "Recorrência", value: "recorrencia" },
  { label: "Transferência", value: "transferencia" },
  { label: "Outro", value: "outro" },
] as const;

export const INSTALLMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  RECONCILED: "reconciled",
} as const;

export const INSTALLMENT_STATUS_LABELS = {
  pending: "Pendente",
  paid: "Pago",
  reconciled: "Conciliado",
} as const;

// Payment methods that support installments
export const INSTALLMENT_ENABLED_METHODS = [
  "credito",
  "pix_programado",
  "recorrencia",
  "outro",
] as const;

// Payment methods tracked for overdue (with grace period)
export const OVERDUE_TRACKABLE_METHODS = [
  "pix_programado",
  "recorrencia",
] as const;

// Grace period in days for overdue detection
export const OVERDUE_GRACE_PERIOD_DAYS = 3;
