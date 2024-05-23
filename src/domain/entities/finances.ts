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
  method: number;
  obs: string;
  valor: number;
  files?: IFiles;
}

export interface IPaymentFirebase {
  createdAt: Timestamp;
  method: number;
  obs: string;
  valor: number;
  files?: IFiles;
}

export interface IFinance {
  id: EntityId;
  createdAt?: string;
  pacotes?: string;
  obs?: string;
  total?: string;
  paymentMethod?: string;
  pago?: number;
  creditsUsed?: number;
  creditsAvailable?: number;
  consultas_id?: string[];
  payments?: IPayment[];
}

export interface IFinanceFirebase {
  id?: string;
  createdAt?: Timestamp;
  pacotes?: string;
  obs?: string;
  total?: string;
  paymentMethod?: string;
  pago?: number;
  creditsUsed?: number;
  creditsAvailable?: number;
  consultas_id?: string[];
  payments?: IPaymentFirebase[];
}
