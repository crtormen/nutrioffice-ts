import { Timestamp } from "firebase/firestore";

export interface IGoalFirebase {
  id?: string;
  createdAt: Timestamp;
  endDate?: Timestamp;
  firstConsulta_id: string;
  lastConsulta_id?: string;
  params: {
    [key: string]: number;
  };
}

export interface IGoal {
  id?: string;
  createdAt?: string;
  endDate?: string;
  firstConsulta_id?: string;
  lastConsulta_id?: string;
  params?: {
    [key: string]: number;
  };
}
