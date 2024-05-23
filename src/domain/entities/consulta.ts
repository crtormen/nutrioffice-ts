import { EntityId } from "@reduxjs/toolkit";
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
  circ_abdomen: number;
  circ_braco_dir: number;
  circ_braco_esq: number;
  circ_cintura: number;
  circ_coxa_dir: number;
  circ_coxa_esq: number;
  circ_gluteo: number;
  circ_ombro: number;
  circ_panturrilha_dir: number;
  circ_panturrilha_esq: number;
  circ_peito: number;
}

export interface IResults {
  dobras: number;
  fat: number;
  mg: number;
  mm: number;
  mo: number;
  mr: number;
}

export interface IStructure {
  altura: number;
  joelho: number;
  punho: number;
}

export interface IConsulta {
  id: EntityId;
  anamnesis_id?: string;
  date?: string;
  updateCredits?: boolean;
  obs?: string;
  peso?: string;
  idade?: number;
  notes?: string[];
  anexos?: IAttachment[];
  images?: IImages;
  dobras?: IFolds;
  medidas?: IMeasures;
  results?: IResults;
  meals?: string[];
  structure?: IStructure;
}

export interface IConsultaFirebase {
  id?: string;
  anamnesis_id?: string;
  date?: Timestamp;
  updateCredits?: boolean;
  obs?: string;
  peso?: string;
  idade?: number;
  notes?: string[];
  anexos?: IAttachment[];
  images?: IImages;
  dobras?: IFolds;
  medidas?: IMeasures;
  results?: IResults;
  meals?: string[];
  structure?: IStructure;
}
