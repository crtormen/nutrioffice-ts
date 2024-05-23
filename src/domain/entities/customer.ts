import { Timestamp } from "firebase/firestore";
import { EntityId } from "@reduxjs/toolkit";

export interface IAddress {
  cep: string;
  city: string;
  district: string;
  street: string;
}

interface Structure {
  height: number;
  knee: number;
  wrist: number;
}

export interface ICustomerFirebase {
  id?: string;
  name?: string;
  email?: string;
  cpf?: string;
  gender?: string;
  birthday?: Timestamp;
  createdAt?: Timestamp;
  credits?: number;
  occupation?: string;
  phone?: string;
  address?: IAddress;
  structure?: Structure;
  instagram?: string;
  cameBy?: string;
}
//adicionar estado civil

export interface ICustomer {
  id: EntityId;
  name?: string;
  email?: string;
  cpf?: string;
  gender?: string;
  birthday?: string;
  createdAt?: string;
  credits?: number;
  occupation?: string;
  phone?: string;
  address?: IAddress;
  structure?: Structure;
  instagram?: string;
  cameBy?: string;
}
