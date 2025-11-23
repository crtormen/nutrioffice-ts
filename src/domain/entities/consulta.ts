import { Timestamp } from "firebase/firestore";

export interface IAttachment {
  path: string;
  url: string;
}

export interface IImages {
  img_costas: IAttachment;
  img_frente: IAttachment;
  img_lado: IAttachment;
}

export const IMG_OPTIONS = ["img_costas", "img_frente", "img_lado"] as const;
export type ImageOptions = (typeof IMG_OPTIONS)[number];

export interface IFolds {
  abdominal: number;
  axilar: number;
  coxa: number;
  peitoral: number;
  subescapular: number;
  supra: number;
  triceps: number;
}

export const FOLDS = [
  { label: "Abdominal", value: "abdominal" },
  { label: "Axilar", value: "axilar" },
  { label: "Coxa", value: "coxa" },
  { label: "Peitoral", value: "peitoral" },
  { label: "Sub-escapular", value: "subescapular" },
  { label: "Supra-ilíaca", value: "supra" },
  { label: "Tríceps", value: "triceps" },
] as const;

export interface IMeasures {
  circ_abdomen?: number;
  circ_braco_dir?: number;
  circ_braco_esq?: number;
  circ_cintura?: number;
  circ_coxa_dir?: number;
  circ_coxa_esq?: number;
  circ_gluteo?: number;
  circ_ombro?: number;
  circ_panturrilha_dir?: number;
  circ_panturrilha_esq?: number;
  circ_peito?: number;
}

export const MEASURES = [
  { label: "Abdômen", value: "circ_abdomen" },
  { label: "Cintura", value: "circ_cintura" },
  { label: "Ombros", value: "circ_ombro" },
  { label: "Glúteos", value: "circ_gluteo" },
  { label: "Peito", value: "circ_peito" },
  { label: "Braço Direito", value: "circ_braco_dir" },
  { label: "Braço Esquerdo", value: "circ_braco_esq" },
  { label: "Coxa Direita", value: "circ_coxa_dir" },
  { label: "Coxa Esquerda", value: "circ_coxa_esq" },
  { label: "Panturrilha Direita", value: "circ_panturrilha_dir" },
  { label: "Panturrilha Esquerda", value: "circ_panturrilha_esq" },
] as const;

export interface IResults {
  dobras: number;
  fat: number;
  mg: number;
  mm: number;
  mo: number;
  mr: number;
}

export const RESULTS = [
  { label: "Soma de Dobras", value: "dobras" },
  { label: "% de Gordura", value: "fat" },
  { label: "Massa Gorda", value: "mg" },
  { label: "Massa Magra", value: "mm" },
  { label: "Massa Óssea", value: "mo" },
  { label: "Massa Residual", value: "mr" },
] as const;

export interface IStructure {
  altura: number;
  joelho: number;
  punho: number;
}

export interface IMeal {
  time: string;
  meal?: string;
  description?: string;
}

export interface ICustomerConsulta {
  id: string;
  online?: boolean;
  pending?: boolean;
  createdAt?: string;
  date?: string;
  updateCredits?: boolean;
  howmuch?: number;
  obs?: string;
  peso?: string;
  idade?: number;
  notes?: string[];
  anexos?: IAttachment[];
  images?: IImages;
  dobras?: IFolds;
  medidas?: IMeasures;
  results?: IResults;
  meals?: IMeal[];
  structure?: IStructure;
}

export interface ICustomerConsultaFirebase {
  id?: string;
  pending?: boolean;
  online?: boolean;
  createdAt?: Timestamp;
  date?: Timestamp;
  updateCredits?: boolean;
  howmuch?: number;
  obs?: string;
  peso?: number;
  idade?: number;
  notes?: string[];
  anexos?: IAttachment[];
  images?: IImages;
  dobras?: IFolds;
  medidas?: IMeasures;
  results?: IResults;
  meals?: IMeal[];
  structure?: IStructure;
}

export interface IConsulta {
  id: string;
  customer_id: string;
  createdAt?: string;
  online?: boolean;
  date?: string;
  gender?: string;
  idade?: number;
  name?: string;
  peso?: string;
  results?: IResults;
}

export interface IConsultaFirebase {
  id?: string;
  online?: boolean;
  customer_id: string;
  createdAt?: Timestamp;
  date?: Timestamp;
  gender?: string;
  idade?: number;
  name?: string;
  peso?: number;
  results?: IResults;
}
