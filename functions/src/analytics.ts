import { onDocumentCreated, onDocumentDeleted, onDocumentWritten } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "./firebase-admin.js";

// ============================================================================
// TIER 1: REAL-TIME INCREMENTAL COUNTERS
// ============================================================================

/**
 * Update counters when a customer is created
 * Increments: totalCustomers
 */
export const onCustomerCreated = onDocumentCreated(
  { document: "users/{userId}/customers/{customerId}" },
  async (event) => {
    const userId = event.params.userId;
    const counterRef = db.doc(`users/${userId}/analytics/counters`);

    await counterRef.set({
      totalCustomers: FieldValue.increment(1),
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });
  }
);

/**
 * Update counters when a customer is deleted
 * Decrements: totalCustomers
 */
export const onCustomerDeleted = onDocumentDeleted(
  { document: "users/{userId}/customers/{customerId}" },
  async (event) => {
    const userId = event.params.userId;
    const counterRef = db.doc(`users/${userId}/analytics/counters`);

    await counterRef.update({
      totalCustomers: FieldValue.increment(-1),
      lastUpdated: FieldValue.serverTimestamp()
    });
  }
);

/**
 * Update counters when a consultation is created
 * Increments: totalConsultations, totalConsultationsThisMonth (if current month)
 */
export const onConsultaCreated = onDocumentCreated(
  { document: "users/{userId}/customers/{customerId}/consultas/{consultaId}" },
  async (event) => {
    const userId = event.params.userId;
    const consultaData = event.data?.data();

    if (!consultaData) return;

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Parse consulta date (format: "dd/MM/yyyy")
    let consultaMonth = currentMonth;
    if (consultaData.date) {
      try {
        const dateParts = consultaData.date.split('/');
        if (dateParts.length === 3) {
          consultaMonth = `${dateParts[2]}-${dateParts[1]}`; // YYYY-MM
        }
      } catch (error) {
        console.error("Error parsing consulta date:", error);
      }
    }

    const counterRef = db.doc(`users/${userId}/analytics/counters`);

    const updates: any = {
      totalConsultations: FieldValue.increment(1),
      lastUpdated: FieldValue.serverTimestamp()
    };

    // Increment this month's counter if consultation is from current month
    if (consultaMonth === currentMonth) {
      updates.totalConsultationsThisMonth = FieldValue.increment(1);
    }

    await counterRef.set(updates, { merge: true });
  }
);

/**
 * Update counters when a consultation is deleted
 * Decrements: totalConsultations
 */
export const onConsultaDeleted = onDocumentDeleted(
  { document: "users/{userId}/customers/{customerId}/consultas/{consultaId}" },
  async (event) => {
    const userId = event.params.userId;
    const consultaData = event.data?.data();

    const currentMonth = new Date().toISOString().slice(0, 7);

    let consultaMonth = currentMonth;
    if (consultaData?.date) {
      try {
        const dateParts = consultaData.date.split('/');
        if (dateParts.length === 3) {
          consultaMonth = `${dateParts[2]}-${dateParts[1]}`;
        }
      } catch (error) {
        console.error("Error parsing consulta date:", error);
      }
    }

    const counterRef = db.doc(`users/${userId}/analytics/counters`);

    const updates: any = {
      totalConsultations: FieldValue.increment(-1),
      lastUpdated: FieldValue.serverTimestamp()
    };

    if (consultaMonth === currentMonth) {
      updates.totalConsultationsThisMonth = FieldValue.increment(-1);
    }

    await counterRef.update(updates);
  }
);

/**
 * Update counters when a finance record is created
 * Increments: totalRevenue, totalRevenueThisMonth, outstandingBalance
 */
export const onFinanceCreated = onDocumentCreated(
  { document: "users/{userId}/customers/{customerId}/finances/{financeId}" },
  async (event) => {
    const userId = event.params.userId;
    const financeData = event.data?.data();

    if (!financeData) return;

    const currentMonth = new Date().toISOString().slice(0, 7);

    // Parse finance creation date
    let financeMonth = currentMonth;
    if (financeData.createdAt) {
      try {
        const date = financeData.createdAt.toDate ? financeData.createdAt.toDate() : new Date(financeData.createdAt);
        financeMonth = date.toISOString().slice(0, 7);
      } catch (error) {
        console.error("Error parsing finance date:", error);
      }
    }

    const counterRef = db.doc(`users/${userId}/analytics/counters`);

    const updates: any = {
      totalRevenue: FieldValue.increment(financeData.total || 0),
      outstandingBalance: FieldValue.increment(financeData.saldo || 0),
      lastUpdated: FieldValue.serverTimestamp()
    };

    if (financeMonth === currentMonth) {
      updates.totalRevenueThisMonth = FieldValue.increment(financeData.total || 0);
    }

    await counterRef.set(updates, { merge: true });
  }
);

/**
 * Update counters when a finance record is updated (e.g., payment made)
 * Updates: outstandingBalance (based on saldo change)
 */
export const onFinanceUpdated = onDocumentWritten(
  { document: "users/{userId}/customers/{customerId}/finances/{financeId}" },
  async (event) => {
    const userId = event.params.userId;
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) return;

    // Calculate change in outstanding balance
    const oldSaldo = beforeData.saldo || 0;
    const newSaldo = afterData.saldo || 0;
    const saldoChange = newSaldo - oldSaldo;

    if (saldoChange !== 0) {
      const counterRef = db.doc(`users/${userId}/analytics/counters`);

      await counterRef.update({
        outstandingBalance: FieldValue.increment(saldoChange),
        lastUpdated: FieldValue.serverTimestamp()
      });
    }
  }
);

/**
 * Update counters when a finance record is deleted
 * Decrements: totalRevenue, outstandingBalance
 */
export const onFinanceDeleted = onDocumentDeleted(
  { document: "users/{userId}/customers/{customerId}/finances/{financeId}" },
  async (event) => {
    const userId = event.params.userId;
    const financeData = event.data?.data();

    if (!financeData) return;

    const currentMonth = new Date().toISOString().slice(0, 7);

    let financeMonth = currentMonth;
    if (financeData.createdAt) {
      try {
        const date = financeData.createdAt.toDate ? financeData.createdAt.toDate() : new Date(financeData.createdAt);
        financeMonth = date.toISOString().slice(0, 7);
      } catch (error) {
        console.error("Error parsing finance date:", error);
      }
    }

    const counterRef = db.doc(`users/${userId}/analytics/counters`);

    const updates: any = {
      totalRevenue: FieldValue.increment(-(financeData.total || 0)),
      outstandingBalance: FieldValue.increment(-(financeData.saldo || 0)),
      lastUpdated: FieldValue.serverTimestamp()
    };

    if (financeMonth === currentMonth) {
      updates.totalRevenueThisMonth = FieldValue.increment(-(financeData.total || 0));
    }

    await counterRef.update(updates);
  }
);

// ============================================================================
// HELPER FUNCTIONS FOR METRIC CALCULATIONS
// ============================================================================

/**
 * Calculate metrics for a specific month
 * @param uid User ID
 * @param year Year (e.g., 2025)
 * @param month Month (1-12)
 * @returns Monthly metrics
 */
async function calculateMonthlyMetrics(uid: string, year: number, month: number) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const monthKey = `${year}-${String(month).padStart(2, '0')}`; // YYYY-MM

  // Get all consultas for this month
  const consultasSnap = await db.collectionGroup("consultas").get();

  const monthConsultas = consultasSnap.docs.filter(doc => {
    const path = doc.ref.path;
    if (!path.startsWith(`users/${uid}/`)) return false;

    const data = doc.data();
    if (!data.date) return false;

    try {
      const consultaDate = data.date.toDate ? data.date.toDate() : new Date(data.date);
      return consultaDate >= monthStart && consultaDate <= monthEnd;
    } catch {
      return false;
    }
  });

  // Count unique active customers (those who had consultas this month)
  const activeCustomersSet = new Set<string>();
  monthConsultas.forEach(doc => {
    const customerId = doc.ref.parent.parent?.id;
    if (customerId) {
      activeCustomersSet.add(customerId);
    }
  });

  // Count new customers created this month
  const newCustomersSnap = await db
    .collection(`users/${uid}/customers`)
    .where("createdAt", ">=", Timestamp.fromDate(monthStart))
    .where("createdAt", "<=", Timestamp.fromDate(monthEnd))
    .count()
    .get();

  // Get all finances for this month
  const financesSnap = await db.collectionGroup("finances").get();

  let monthRevenue = 0;
  const revenueByMethod: Record<string, number> = {};

  financesSnap.docs.forEach(doc => {
    const path = doc.ref.path;
    if (!path.startsWith(`users/${uid}/`)) return;

    const finance = doc.data();
    if (!finance.createdAt) return;

    try {
      const financeDate = finance.createdAt.toDate ? finance.createdAt.toDate() : new Date(finance.createdAt);

      if (financeDate >= monthStart && financeDate <= monthEnd) {
        monthRevenue += finance.total || 0;

        // Aggregate by payment method
        if (finance.payments && Array.isArray(finance.payments)) {
          finance.payments.forEach((payment: any) => {
            const method = payment.method || "unknown";
            revenueByMethod[method] = (revenueByMethod[method] || 0) + (payment.valor || 0);
          });
        }
      }
    } catch {
      // Ignore date parsing errors
    }
  });

  // Truncate revenue to 2 decimal places
  monthRevenue = Math.round(monthRevenue * 100) / 100;
  Object.keys(revenueByMethod).forEach(method => {
    revenueByMethod[method] = Math.round(revenueByMethod[method] * 100) / 100;
  });

  // Calculate average revenue per customer
  const avgRevenuePerCustomer = activeCustomersSet.size > 0
    ? Math.round((monthRevenue / activeCustomersSet.size) * 100) / 100
    : 0;

  return {
    monthKey,
    month: Timestamp.fromDate(monthStart),
    newCustomers: newCustomersSnap.data().count,
    totalConsultations: monthConsultas.length,
    revenue: monthRevenue,
    revenueByMethod,
    activeCustomers: activeCustomersSet.size,
    averageRevenuePerCustomer: avgRevenuePerCustomer,
    generatedAt: FieldValue.serverTimestamp()
  };
}

/**
 * Backfill historical monthly data
 * @param uid User ID
 * @param monthsBack Number of months to backfill (default: 24 for 2 years)
 */
async function backfillMonthlyData(uid: string, monthsBack = 24) {
  const now = new Date();
  const results: any[] = [];

  for (let i = 0; i < monthsBack; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;

    try {
      const metrics = await calculateMonthlyMetrics(uid, year, month);

      // Store monthly rollup
      await db.doc(`users/${uid}/analytics/counters/monthly/${metrics.monthKey}`).set(metrics);

      results.push({
        monthKey: metrics.monthKey,
        consultations: metrics.totalConsultations,
        revenue: metrics.revenue
      });

      console.log(`Backfilled ${metrics.monthKey}: ${metrics.totalConsultations} consultas, ${metrics.revenue} revenue`);
    } catch (error) {
      console.error(`Error backfilling ${year}-${month}:`, error);
    }
  }

  return results;
}

// ============================================================================
// TIER 3: SCHEDULED AGGREGATIONS
// ============================================================================

/**
 * Daily aggregation function - runs at 2 AM (Sao Paulo time)
 * Aggregates previous day's data into daily rollup documents
 * Uses FREE Cloud Scheduler slot
 */
export const aggregateDailyMetrics = onSchedule(
  {
    schedule: "0 2 * * *",  // 2 AM daily
    timeZone: "America/Sao_Paulo",
    memory: "512MiB"
  },
  async (event) => {
    console.log("Starting daily metrics aggregation");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateKey = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
    const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));

    // Get all users
    const usersSnapshot = await db.collection("users").get();
    console.log(`Processing ${usersSnapshot.size} users`);

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;

      try {
        // Count new customers created yesterday
        const newCustomersSnap = await db
          .collection(`users/${uid}/customers`)
          .where("createdAt", ">=", Timestamp.fromDate(yesterdayStart))
          .where("createdAt", "<=", Timestamp.fromDate(yesterdayEnd))
          .count()
          .get();

        // Get all consultas from yesterday
        const consultasSnap = await db
          .collectionGroup("consultas")
          .where("date", ">=", Timestamp.fromDate(yesterdayStart))
          .where("date", "<=", Timestamp.fromDate(yesterdayEnd))
          .get();

        // Filter consultas for this user only
        const userConsultas = consultasSnap.docs.filter(doc => {
          const path = doc.ref.path;
          return path.startsWith(`users/${uid}/`);
        });

        // Aggregate consultation types
        let onlineCount = 0;
        let inPersonCount = 0;

        userConsultas.forEach(doc => {
          const data = doc.data();
          if (data.online) {
            onlineCount++;
          } else {
            inPersonCount++;
          }
        });

        // Get all finances from yesterday
        const financesSnap = await db
          .collectionGroup("finances")
          .get();

        // Filter finances for this user and yesterday
        const userFinances = financesSnap.docs.filter(doc => {
          const path = doc.ref.path;
          if (!path.startsWith(`users/${uid}/`)) return false;

          const data = doc.data();
          if (!data.createdAt) return false;

          try {
            const financeDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            return financeDate >= yesterdayStart && financeDate <= yesterdayEnd;
          } catch {
            return false;
          }
        });

        // Aggregate revenue and payment methods
        let totalRevenue = 0;
        const revenueByMethod: Record<string, number> = {};

        userFinances.forEach(doc => {
          const finance = doc.data();
          totalRevenue += finance.total || 0;

          // Aggregate by payment method
          if (finance.payments && Array.isArray(finance.payments)) {
            finance.payments.forEach((payment: any) => {
              const method = payment.method || "unknown";
              revenueByMethod[method] = (revenueByMethod[method] || 0) + (payment.valor || 0);
            });
          }
        });

        // Truncate revenue to 2 decimal places
        totalRevenue = Math.round(totalRevenue * 100) / 100;
        Object.keys(revenueByMethod).forEach(method => {
          revenueByMethod[method] = Math.round(revenueByMethod[method] * 100) / 100;
        });

        // Store daily rollup
        await db.doc(`users/${uid}/analytics/counters/daily/${dateKey}`).set({
          date: Timestamp.fromDate(yesterdayStart),
          newCustomers: newCustomersSnap.data().count,
          consultationsCount: userConsultas.length,
          consultationTypes: {
            online: onlineCount,
            inPerson: inPersonCount
          },
          revenueTotal: totalRevenue,
          revenueByMethod,
          generatedAt: FieldValue.serverTimestamp()
        });

        console.log(`Aggregated metrics for user ${uid}: ${userConsultas.length} consultas, ${totalRevenue} revenue`);

      } catch (error) {
        console.error(`Error aggregating for user ${uid}:`, error);
      }
    }

    console.log("Daily metrics aggregation complete");
  }
);

/**
 * Monthly aggregation function - runs on 1st of month at 3 AM
 * Aggregates previous month's data from daily rollups
 * Uses FREE Cloud Scheduler slot
 */
export const aggregateMonthlyMetrics = onSchedule(
  {
    schedule: "0 3 1 * *",  // 3 AM on 1st of every month
    timeZone: "America/Sao_Paulo",
    memory: "512MiB"
  },
  async (event) => {
    console.log("Starting monthly metrics aggregation");

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthKey = lastMonth.toISOString().slice(0, 7); // YYYY-MM

    const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    const usersSnapshot = await db.collection("users").get();
    console.log(`Processing ${usersSnapshot.size} users`);

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;

      try {
        // Aggregate daily rollups for the month
        const dailyRollupsSnap = await db
          .collection(`users/${uid}/analytics/counters/daily`)
          .where("date", ">=", Timestamp.fromDate(monthStart))
          .where("date", "<=", Timestamp.fromDate(monthEnd))
          .get();

        let totalNewCustomers = 0;
        let totalConsultations = 0;
        let totalRevenue = 0;

        dailyRollupsSnap.docs.forEach(doc => {
          const data = doc.data();
          totalNewCustomers += data.newCustomers || 0;
          totalConsultations += data.consultationsCount || 0;
          totalRevenue += data.revenueTotal || 0;
        });

        // Count unique customers who had consultations this month
        const consultasSnap = await db
          .collectionGroup("consultas")
          .get();

        const activeCustomersSet = new Set<string>();

        consultasSnap.docs.forEach(doc => {
          const path = doc.ref.path;
          if (!path.startsWith(`users/${uid}/`)) return;

          const data = doc.data();
          if (!data.date) return;

          try {
            // Handle Firestore Timestamp
            const consultaDate = data.date.toDate ? data.date.toDate() : new Date(data.date);

            if (consultaDate >= monthStart && consultaDate <= monthEnd) {
              const customerId = doc.ref.parent.parent?.id;
              if (customerId) {
                activeCustomersSet.add(customerId);
              }
            }
          } catch (error) {
            console.error("Error parsing date:", error);
          }
        });

        // Truncate revenue to 2 decimal places
        totalRevenue = Math.round(totalRevenue * 100) / 100;

        // Calculate average revenue per customer
        const avgRevenuePerCustomer = activeCustomersSet.size > 0
          ? totalRevenue / activeCustomersSet.size
          : 0;

        // Store monthly rollup
        await db.doc(`users/${uid}/analytics/counters/monthly/${monthKey}`).set({
          month: Timestamp.fromDate(monthStart),
          newCustomers: totalNewCustomers,
          totalConsultations,
          revenue: totalRevenue,
          activeCustomers: activeCustomersSet.size,
          averageRevenuePerCustomer: Math.round(avgRevenuePerCustomer * 100) / 100,
          generatedAt: FieldValue.serverTimestamp()
        });

        console.log(`Aggregated monthly metrics for user ${uid}`);

      } catch (error) {
        console.error(`Error aggregating monthly metrics for user ${uid}:`, error);
      }
    }

    console.log("Monthly metrics aggregation complete");
  }
);

// ============================================================================
// MANUAL TRIGGER FUNCTIONS
// ============================================================================

/**
 * Manually trigger monthly metrics aggregation
 * Can be called from the frontend or via Firebase Console
 * Requires authentication
 */
export const triggerMonthlyAggregation = onCall(
  {
    timeoutSeconds: 540,
    memory: "512MiB",
    cors: true, // Enable CORS for all origins
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    console.log(`Manual monthly aggregation triggered by user ${uid}`);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthKey = lastMonth.toISOString().slice(0, 7); // YYYY-MM

    const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    try {
      // Aggregate daily rollups for the month
      const dailyRollupsSnap = await db
        .collection(`users/${uid}/analytics/daily`)
        .where("date", ">=", Timestamp.fromDate(monthStart))
        .where("date", "<=", Timestamp.fromDate(monthEnd))
        .get();

      let totalNewCustomers = 0;
      let totalConsultations = 0;
      let totalRevenue = 0;

      dailyRollupsSnap.docs.forEach(doc => {
        const data = doc.data();
        totalNewCustomers += data.newCustomers || 0;
        totalConsultations += data.consultationsCount || 0;
        totalRevenue += data.revenueTotal || 0;
      });

      // Count unique customers who had consultations this month
      const consultasSnap = await db
        .collectionGroup("consultas")
        .get();

      const activeCustomersSet = new Set<string>();

      consultasSnap.docs.forEach(doc => {
        const path = doc.ref.path;
        if (!path.startsWith(`users/${uid}/`)) return;

        const data = doc.data();
        if (!data.date) return;

        try {
          // Handle Firestore Timestamp
          const consultaDate = data.date.toDate ? data.date.toDate() : new Date(data.date);

          if (consultaDate >= monthStart && consultaDate <= monthEnd) {
            const customerId = doc.ref.parent.parent?.id;
            if (customerId) {
              activeCustomersSet.add(customerId);
            }
          }
        } catch (error) {
          console.error("Error parsing date:", error);
        }
      });

      // Truncate revenue to 2 decimal places
      totalRevenue = Math.round(totalRevenue * 100) / 100;

      // Calculate average revenue per customer
      const avgRevenuePerCustomer = activeCustomersSet.size > 0
        ? totalRevenue / activeCustomersSet.size
        : 0;

      // Store monthly rollup
      await db.doc(`users/${uid}/analytics/counters/monthly/${monthKey}`).set({
        month: Timestamp.fromDate(monthStart),
        newCustomers: totalNewCustomers,
        totalConsultations,
        revenue: totalRevenue,
        activeCustomers: activeCustomersSet.size,
        averageRevenuePerCustomer: Math.round(avgRevenuePerCustomer * 100) / 100,
        generatedAt: FieldValue.serverTimestamp()
      });

      console.log(`Manual aggregation complete for user ${uid}: ${totalConsultations} consultas, ${totalRevenue} revenue`);

      return {
        success: true,
        monthKey,
        metrics: {
          newCustomers: totalNewCustomers,
          totalConsultations,
          revenue: totalRevenue,
          activeCustomers: activeCustomersSet.size,
          averageRevenuePerCustomer: Math.round(avgRevenuePerCustomer * 100) / 100
        }
      };

    } catch (error) {
      console.error(`Error in manual aggregation for user ${uid}:`, error);
      throw new HttpsError('internal', 'Failed to aggregate monthly metrics');
    }
  }
);

/**
 * Initialize analytics counters for a user
 * Useful for onboarding or after deployment
 */
export const initializeAnalytics = onCall(
  {
    timeoutSeconds: 540,
    memory: "512MiB",
    cors: true, // Enable CORS for all origins
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    console.log(`Initializing analytics for user ${uid}`);

    try {
      // Count all customers
      const customersSnap = await db
        .collection(`users/${uid}/customers`)
        .count()
        .get();

      // Count all consultas
      const consultasSnap = await db
        .collectionGroup("consultas")
        .get();

      const userConsultas = consultasSnap.docs.filter(doc =>
        doc.ref.path.startsWith(`users/${uid}/`)
      );

      // Calculate current month consultas
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentMonthConsultas = userConsultas.filter(doc => {
        const data = doc.data();
        if (!data.date) return false;

        try {
          // Handle Firestore Timestamp
          const consultaDate = data.date.toDate ? data.date.toDate() : new Date(data.date);
          const consultaMonth = consultaDate.toISOString().slice(0, 7);
          return consultaMonth === currentMonth;
        } catch {
          return false;
        }
      });

      // Get all finances
      const financesSnap = await db
        .collectionGroup("finances")
        .get();

      const userFinances = financesSnap.docs.filter(doc =>
        doc.ref.path.startsWith(`users/${uid}/`)
      );

      let totalRevenue = 0;
      let outstandingBalance = 0;
      let currentMonthRevenue = 0;

      userFinances.forEach(doc => {
        const finance = doc.data();
        totalRevenue += finance.total || 0;
        outstandingBalance += finance.saldo || 0;

        // Check if this month
        if (finance.createdAt) {
          try {
            const financeDate = finance.createdAt.toDate ? finance.createdAt.toDate() : new Date(finance.createdAt);
            const financeMonth = financeDate.toISOString().slice(0, 7);
            if (financeMonth === currentMonth) {
              currentMonthRevenue += finance.total || 0;
            }
          } catch {
            // Ignore date parsing errors
          }
        }
      });

      // Truncate all revenue values to 2 decimal places
      totalRevenue = Math.round(totalRevenue * 100) / 100;
      outstandingBalance = Math.round(outstandingBalance * 100) / 100;
      currentMonthRevenue = Math.round(currentMonthRevenue * 100) / 100;

      // Initialize counters
      await db.doc(`users/${uid}/analytics/counters`).set({
        totalCustomers: customersSnap.data().count,
        totalConsultations: userConsultas.length,
        totalConsultationsThisMonth: currentMonthConsultas.length,
        totalRevenue,
        totalRevenueThisMonth: currentMonthRevenue,
        outstandingBalance,
        lastUpdated: FieldValue.serverTimestamp(),
        initializedAt: FieldValue.serverTimestamp()
      });

      console.log(`Analytics counters initialized for user ${uid}`);

      // Backfill historical monthly data (last 24 months)
      console.log(`Starting backfill of historical monthly data for user ${uid}`);
      const backfilledMonths = await backfillMonthlyData(uid, 24);
      console.log(`Backfilled ${backfilledMonths.length} months of historical data`);

      return {
        success: true,
        counters: {
          totalCustomers: customersSnap.data().count,
          totalConsultations: userConsultas.length,
          totalConsultationsThisMonth: currentMonthConsultas.length,
          totalRevenue,
          totalRevenueThisMonth: currentMonthRevenue,
          outstandingBalance
        },
        monthlyDataBackfilled: backfilledMonths.length,
        sampleMonths: backfilledMonths.slice(0, 3) // Return first 3 months as sample
      };

    } catch (error) {
      console.error(`Error initializing analytics for user ${uid}:`, error);
      throw new HttpsError('internal', 'Failed to initialize analytics');
    }
  }
);
