import { firestoreApi } from "../firestoreApi";
import { AnalyticsService } from "@/app/services/AnalyticsService";
import {
  IAnalyticsCounters,
  IDailyRollup,
  IMonthlyRollup,
} from "@/domain/entities";

export interface IDashboardMetrics {
  counters: IAnalyticsCounters;
  dailyRollups: IDailyRollup[];
  monthlyRollups: IMonthlyRollup[];
}

export interface IPeriodComparison {
  current: {
    startDate: Date;
    endDate: Date;
    metrics: {
      newCustomers: number;
      consultationsCount: number;
      revenue: number;
    };
  };
  previous?: {
    startDate: Date;
    endDate: Date;
    metrics: {
      newCustomers: number;
      consultationsCount: number;
      revenue: number;
    };
  };
  percentageChange?: {
    customers: number;
    consultations: number;
    revenue: number;
  };
}

export const analyticsSlice = firestoreApi.injectEndpoints({
  endpoints: (builder) => ({
    // Real-time subscription to analytics counters
    fetchAnalyticsCounters: builder.query<IAnalyticsCounters, string>({
      queryFn: () => ({
        data: {
          totalCustomers: 0,
          activeCustomers: 0,
          totalConsultations: 0,
          totalConsultationsThisMonth: 0,
          totalRevenue: 0,
          totalRevenueThisMonth: 0,
          outstandingBalance: 0,
        },
      }),
      providesTags: ["Analytics"],
      async onCacheEntryAdded(
        uid,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        let unsubscribe: (() => void) | undefined;

        try {
          await cacheDataLoaded;

          const service = AnalyticsService(uid);
          if (!service) return;

          unsubscribe = service.subscribeToCounters((counters) => {
            updateCachedData(() => counters);
          });
        } catch (error) {
          console.error("Error subscribing to analytics counters:", error);
        }

        await cacheEntryRemoved;
        unsubscribe?.();
      },
    }),

    // Fetch dashboard metrics for a specific period
    fetchDashboardMetrics: builder.query<
      IDashboardMetrics,
      { uid: string; startDate: Date; endDate: Date }
    >({
      queryFn: async ({ uid, startDate, endDate }) => {
        try {
          const service = AnalyticsService(uid);
          if (!service) {
            throw new Error("AnalyticsService not available");
          }

          const [counters, dailyRollups] = await Promise.all([
            service.getCounters(),
            service.getDailyRollups(startDate, endDate),
          ]);

          // Calculate months difference for monthly rollups
          const monthsDiff =
            (endDate.getFullYear() - startDate.getFullYear()) * 12 +
            (endDate.getMonth() - startDate.getMonth()) +
            1;
          const monthlyRollups = await service.getMonthlyRollups(
            Math.min(monthsDiff, 12)
          );

          return {
            data: {
              counters,
              dailyRollups,
              monthlyRollups,
            },
          };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          };
        }
      },
      providesTags: ["Analytics"],
    }),

    // Fetch monthly trends for historical data
    fetchMonthlyTrends: builder.query<
      IMonthlyRollup[],
      { uid: string; months: number }
    >({
      queryFn: async ({ uid, months }) => {
        try {
          const service = AnalyticsService(uid);
          if (!service) {
            throw new Error("AnalyticsService not available");
          }

          const monthlyRollups = await service.getMonthlyRollups(months);

          return { data: monthlyRollups };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          };
        }
      },
      providesTags: ["Analytics"],
    }),

    // Fetch period comparison data
    fetchPeriodComparison: builder.query<
      IPeriodComparison,
      {
        uid: string;
        currentStart: Date;
        currentEnd: Date;
        previousStart?: Date;
        previousEnd?: Date;
      }
    >({
      queryFn: async ({
        uid,
        currentStart,
        currentEnd,
        previousStart,
        previousEnd,
      }) => {
        try {
          const service = AnalyticsService(uid);
          if (!service) {
            throw new Error("AnalyticsService not available");
          }

          const currentRollups = await service.getDailyRollups(
            currentStart,
            currentEnd
          );

          const currentMetrics = currentRollups.reduce(
            (acc, rollup) => ({
              newCustomers: acc.newCustomers + rollup.newCustomers,
              consultationsCount:
                acc.consultationsCount + rollup.consultationsCount,
              revenue: acc.revenue + rollup.revenueTotal,
            }),
            { newCustomers: 0, consultationsCount: 0, revenue: 0 }
          );

          const result: IPeriodComparison = {
            current: {
              startDate: currentStart,
              endDate: currentEnd,
              metrics: currentMetrics,
            },
          };

          // Fetch previous period if dates provided
          if (previousStart && previousEnd) {
            const previousRollups = await service.getDailyRollups(
              previousStart,
              previousEnd
            );

            const previousMetrics = previousRollups.reduce(
              (acc, rollup) => ({
                newCustomers: acc.newCustomers + rollup.newCustomers,
                consultationsCount:
                  acc.consultationsCount + rollup.consultationsCount,
                revenue: acc.revenue + rollup.revenueTotal,
              }),
              { newCustomers: 0, consultationsCount: 0, revenue: 0 }
            );

            result.previous = {
              startDate: previousStart,
              endDate: previousEnd,
              metrics: previousMetrics,
            };

            // Calculate percentage changes
            result.percentageChange = {
              customers:
                previousMetrics.newCustomers > 0
                  ? ((currentMetrics.newCustomers -
                      previousMetrics.newCustomers) /
                      previousMetrics.newCustomers) *
                    100
                  : 0,
              consultations:
                previousMetrics.consultationsCount > 0
                  ? ((currentMetrics.consultationsCount -
                      previousMetrics.consultationsCount) /
                      previousMetrics.consultationsCount) *
                    100
                  : 0,
              revenue:
                previousMetrics.revenue > 0
                  ? ((currentMetrics.revenue - previousMetrics.revenue) /
                      previousMetrics.revenue) *
                    100
                  : 0,
            };
          }

          return { data: result };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          };
        }
      },
      providesTags: ["Analytics"],
    }),
  }),
});

export const {
  useFetchAnalyticsCountersQuery,
  useFetchDashboardMetricsQuery,
  useFetchMonthlyTrendsQuery,
  useFetchPeriodComparisonQuery,
} = analyticsSlice;
