import { Timestamp } from "firebase/firestore";

import { IStructure } from "./consulta";

export const HOMEM = "H";
export const MULHER = "M";
export const AMBOS = "B";

export interface IAddress {
  cep: string;
  city: string;
  district: string;
  street: string;
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
  structure?: IStructure;
  instagram?: string;
  cameBy?: string;
}
// adicionar estado civil

export interface ICustomer {
  id?: string;
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
  structure?: IStructure;
  instagram?: string;
  cameBy?: string;
}
