/**
 * Firebase Cloud Functions entry point
 * This file exports all cloud functions for deployment
 */

// Export the Express API
export { api } from "./api.js";

// Export legacy functions for backward compatibility
export {
  getMonthCustomers,
  getMonthFinances,
  fixDates,
  onCreateConsulta,
  copyDB,
  getCustomersEmail,
} from "./old.js";

// Export new functions (v2 functions and user management)
export {
  createAuthUser,
  onCreateFirestoreUserSetCustomClaims,
  onCreateFirestoreUserLoadDefaultSettings,
  onUpdateFirestoreUser,
  setDefaultSettingsOnFirestore,
  initializeUserSettings,
  redefineCustomClaims,
  checkCustomClaims,
  updateLastConsultaDate,
} from "./new.js";

// Export analytics functions
export {
  onCustomerCreated,
  onCustomerDeleted,
  onConsultaCreated,
  onConsultaDeleted,
  onFinanceCreated,
  onFinanceUpdated,
  onFinanceDeleted,
  aggregateDailyMetrics,
  aggregateMonthlyMetrics,
  triggerMonthlyAggregation,
  initializeAnalytics,
} from "./analytics.js";

// Export subscription functions
export {
  createSubscription,
  cancelSubscription,
  changeSubscription,
  mercadoPagoWebhook,
  updateCustomerCount,
  checkSubscriptionLimits,
  initializeFreeTierOnUserCreation,
} from "./subscriptions.js";

// Export form submission functions
export {
  onFormSubmissionCreated,
} from "./formSubmissions.js";
