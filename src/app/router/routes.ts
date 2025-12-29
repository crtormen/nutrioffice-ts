export const ROUTES = {
  DASHBOARD: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DEMO: "/demo",
  CUSTOMERS: {
    BASE: "customers",
    CREATE: "customers/create",
    DETAILS: (customerId: string) => `customers/${customerId}`,
    CREATEANAMNESIS: (customerId: string) => `customers/${customerId}/create-anamnesis`,
    EDITANAMNESIS: (customerId: string, anamnesisId: string) => `customers/${customerId}/edit-anamnesis/${anamnesisId}`
  },
  CONSULTAS: {
    BASE: "consultas",
    CREATE: (customerId: string) => `consultas/${customerId}/create`,
    DETAILS: (customerId: string, consultaId: string) => `consultas/${customerId}/${consultaId}`,
  },
  FINANCES: {
    BASE: "finances",
    DETAILS: (financeId: string) => `finances/details/${financeId}`,
  },
  USER: {
    BASE: "user",
    PROFILE: "user/profile",
    SETTINGS: "user/settings",
  },
  SUBSCRIPTION: {
    BASE: "subscription",
    PRICING: "subscription/pricing",
    PROCESSING: "subscription/processing",
    CALLBACK: "subscription/callback",
    MANAGE: "subscription/manage",
  },
  PUBLIC: {
    ANAMNESIS_FORM: (token: string) => `/anamnesis/public/${token}`,
  },
  FORM_SUBMISSIONS: "form-submissions",
};