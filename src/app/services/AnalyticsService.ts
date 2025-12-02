import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
  where,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/infra/firebase";
import {
  IAnalyticsCounters,
  IDailyRollup,
  IDailyRollupFirebase,
  IMonthlyRollup,
  IMonthlyRollupFirebase,
} from "@/domain/entities";
import { dateInString } from "@/lib/utils";
import { createCollectionRef, DatabaseService } from "./DatabaseService";

// Collection references
const DailyCollection = (uid: string) => {
  if (!uid) return null;
  return collection(db, `users/${uid}/analytics/counters/daily`) as import("firebase/firestore").CollectionReference<IDailyRollupFirebase>;
};

const MonthlyCollection = (uid: string) => {
  if (!uid) return null;
  return collection(db, `users/${uid}/analytics/counters/monthly`) as import("firebase/firestore").CollectionReference<IMonthlyRollupFirebase>;
};

export const AnalyticsService = (uid?: string) => {
  if (!uid) return null;

  const countersRef = doc(db, `users/${uid}/analytics/counters`);
  const dailyCollection = DailyCollection(uid);
  const monthlyCollection = MonthlyCollection(uid);

  if (!dailyCollection || !monthlyCollection) return null;

  // Setup daily service with converter
  const dailyService = new DatabaseService<IDailyRollupFirebase>(
    dailyCollection
  );
  dailyService.query = query(
    dailyCollection.withConverter({
      toFirestore({
        ...data
      }: PartialWithFieldValue<IDailyRollup>): DocumentData {
        return data;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IDailyRollupFirebase>,
        options: SnapshotOptions
      ): IDailyRollup {
        const data = snapshot.data(options);
        return {
          date: dateInString(data.date) || "",
          newCustomers: data.newCustomers || 0,
          consultationsCount: data.consultationsCount || 0,
          revenueTotal: data.revenueTotal || 0,
          revenueByMethod: data.revenueByMethod || {},
          consultationTypes: data.consultationTypes || {
            online: 0,
            inPerson: 0,
          },
        };
      },
    }),
    orderBy("date", "asc")
  );

  // Setup monthly service with converter
  const monthlyService = new DatabaseService<IMonthlyRollupFirebase>(
    monthlyCollection
  );
  monthlyService.query = query(
    monthlyCollection.withConverter({
      toFirestore({
        ...data
      }: PartialWithFieldValue<IMonthlyRollup>): DocumentData {
        return data;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IMonthlyRollupFirebase>,
        options: SnapshotOptions
      ): IMonthlyRollup {
        const data = snapshot.data(options);
        return {
          month: data.month?.toDate().toISOString().slice(0, 7) || "", // Use YYYY-MM format for comparison
          newCustomers: data.newCustomers || 0,
          totalConsultations: data.totalConsultations || 0,
          revenue: data.revenue || 0,
          activeCustomers: data.activeCustomers || 0,
          averageRevenuePerCustomer: data.averageRevenuePerCustomer || 0,
        };
      },
    }),
    orderBy("month", "desc")
  );

  return {
    /**
     * Subscribe to real-time counter updates
     */
    subscribeToCounters: (
      callback: (counters: IAnalyticsCounters) => void
    ) => {
      return onSnapshot(countersRef, (snapshot: any) => {
        const data = snapshot.data();
        if (data) {
          callback({
            totalCustomers: data.totalCustomers || 0,
            activeCustomers: data.activeCustomers || 0,
            totalConsultations: data.totalConsultations || 0,
            totalConsultationsThisMonth: data.totalConsultationsThisMonth || 0,
            totalRevenue: data.totalRevenue || 0,
            totalRevenueThisMonth: data.totalRevenueThisMonth || 0,
            outstandingBalance: data.outstandingBalance || 0,
            lastUpdated: data.lastUpdated?.toDate().toISOString(),
          });
        } else {
          callback({
            totalCustomers: 0,
            activeCustomers: 0,
            totalConsultations: 0,
            totalConsultationsThisMonth: 0,
            totalRevenue: 0,
            totalRevenueThisMonth: 0,
            outstandingBalance: 0,
          });
        }
      });
    },

    /**
     * Fetch counters once (no real-time subscription)
     */
    getCounters: async (): Promise<IAnalyticsCounters> => {
      const snapshot = await getDoc(countersRef);
      const data = snapshot.data();

      if (!data) {
        return {
          totalCustomers: 0,
          activeCustomers: 0,
          totalConsultations: 0,
          totalConsultationsThisMonth: 0,
          totalRevenue: 0,
          totalRevenueThisMonth: 0,
          outstandingBalance: 0,
        };
      }

      return {
        totalCustomers: data.totalCustomers || 0,
        activeCustomers: data.activeCustomers || 0,
        totalConsultations: data.totalConsultations || 0,
        totalConsultationsThisMonth: data.totalConsultationsThisMonth || 0,
        totalRevenue: data.totalRevenue || 0,
        totalRevenueThisMonth: data.totalRevenueThisMonth || 0,
        outstandingBalance: data.outstandingBalance || 0,
        lastUpdated: data.lastUpdated?.toDate().toISOString(),
      };
    },

    /**
     * Fetch daily rollups for a date range
     */
    getDailyRollups: async (
      startDate: Date,
      endDate: Date
    ): Promise<IDailyRollup[]> => {
      const q = query(
        dailyCollection.withConverter({
          toFirestore({
            ...data
          }: PartialWithFieldValue<IDailyRollup>): DocumentData {
            return data;
          },
          fromFirestore(
            snapshot: QueryDocumentSnapshot<IDailyRollupFirebase>,
            options: SnapshotOptions
          ): IDailyRollup {
            const data = snapshot.data(options);
            return {
              date: dateInString(data.date) || "",
              newCustomers: data.newCustomers || 0,
              consultationsCount: data.consultationsCount || 0,
              revenueTotal: data.revenueTotal || 0,
              revenueByMethod: data.revenueByMethod || {},
              consultationTypes: data.consultationTypes || {
                online: 0,
                inPerson: 0,
              },
            };
          },
        }),
        where("date", ">=", Timestamp.fromDate(startDate)),
        where("date", "<=", Timestamp.fromDate(endDate)),
        orderBy("date", "asc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.data() as IDailyRollup);
    },

    /**
     * Fetch last N months of monthly rollups
     */
    getMonthlyRollups: async (months: number): Promise<IMonthlyRollup[]> => {
      const q = query(
        monthlyCollection.withConverter({
          toFirestore({
            ...data
          }: PartialWithFieldValue<IMonthlyRollup>): DocumentData {
            return data;
          },
          fromFirestore(
            snapshot: QueryDocumentSnapshot<IMonthlyRollupFirebase>,
            options: SnapshotOptions
          ): IMonthlyRollup {
            const data = snapshot.data(options);
            return {
              month: data.month?.toDate().toISOString().slice(0, 7) || "", // Use YYYY-MM format for comparison
              newCustomers: data.newCustomers || 0,
              totalConsultations: data.totalConsultations || 0,
              revenue: data.revenue || 0,
              activeCustomers: data.activeCustomers || 0,
              averageRevenuePerCustomer: data.averageRevenuePerCustomer || 0,
            };
          },
        }),
        orderBy("month", "desc"),
        limit(months)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.data() as IMonthlyRollup);
    },
  };
};
