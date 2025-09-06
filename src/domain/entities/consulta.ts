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

export interface IResults {
  dobras: number;
  fat: number;
  mg: number;
  mm: number;
  mo: number;
  mr: number;
}

export const RESULTS: Record<string, { text: string; value: string }> = {
  dobras: { text: "Soma de Dobras", value: "dobras" },
  fat: { text: "% de Gordura", value: "fat" },
  mg: { text: "Massa Gorda", value: "mg" },
  mm: { text: "Massa Magra", value: "mm" },
  mo: { text: "Massa Óssea", value: "mo" },
  mr: { text: "Massa Residual", value: "mr" },
};

export interface IStructure {
  altura: number;
  joelho: number;
  punho: number;
}

export interface IMeal {
  time: string;
  meal: string;
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
