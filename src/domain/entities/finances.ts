import { EntityId } from "@reduxjs/toolkit";
import { Timestamp } from "firebase/firestore";

interface IFiles {
  arquivo: {
    path: string;
    url: string;
  };
}

export interface IPayment {
  createdAt: string;
  method: string; // Changed to string for better flexibility (PIX, Cartão, Dinheiro, etc)
  obs?: string;
  valor: number;
  files?: IFiles;
}

export interface IPaymentFirebase {
  createdAt: Timestamp;
  method: string;
  obs?: string;
  valor: number;
  files?: IFiles;
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
  { label: "Transferência", value: "transferencia" },
  { label: "Outro", value: "outro" },
] as const;
