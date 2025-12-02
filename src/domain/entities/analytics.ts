import { Timestamp } from "firebase/firestore";

// Firebase version with Timestamp
export interface IAnalyticsCountersFirebase {
  totalCustomers: number;
  activeCustomers: number;
  totalConsultations: number;
  totalConsultationsThisMonth: number;
  totalRevenue: number;
  totalRevenueThisMonth: number;
  outstandingBalance: number;
  lastUpdated?: Timestamp;
}

// App version with string dates
export interface IAnalyticsCounters {
  totalCustomers: number;
  activeCustomers: number;
  totalConsultations: number;
  totalConsultationsThisMonth: number;
  totalRevenue: number;
  totalRevenueThisMonth: number;
  outstandingBalance: number;
  lastUpdated?: string;
}

// Firebase version
export interface IDailyRollupFirebase {
  date: Timestamp;
  newCustomers: number;
  consultationsCount: number;
  revenueTotal: number;
  revenueByMethod: Record<string, number>;
  consultationTypes: {
    online: number;
    inPerson: number;
  };
}

// App version
export interface IDailyRollup {
  date: string;
  newCustomers: number;
  consultationsCount: number;
  revenueTotal: number;
  revenueByMethod: Record<string, number>;
  consultationTypes: {
    online: number;
    inPerson: number;
  };
}

// Firebase version
export interface IMonthlyRollupFirebase {
  month: Timestamp;
  newCustomers: number;
  totalConsultations: number;
  revenue: number;
  activeCustomers: number;
  averageRevenuePerCustomer: number;
}

// App version
export interface IMonthlyRollup {
  month: string;
  newCustomers: number;
  totalConsultations: number;
  revenue: number;
  activeCustomers: number;
  averageRevenuePerCustomer: number;
}
