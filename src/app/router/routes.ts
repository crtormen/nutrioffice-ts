// Route definitions (relative paths for React Router)
const ROUTE_PATHS = {
  DASHBOARD: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DEMO: "/demo",
  CUSTOMERS: {
    BASE: "customers",
    CREATE: "create",
    CREATE_ANAMNESIS: "create-anamnesis",
    EDIT_ANAMNESIS: "edit-anamnesis",
    CONSULTAS: {
      BASE: "consultas",
      CREATE: "create",
    },
  },
  CONSULTAS: {
    BASE: "consultas",
  },
  FINANCES: {
    BASE: "finances",
    DETAILS_BASE: "details",
  },
  USER: {
    BASE: "user",
    PROFILE: "profile",
    SETTINGS: "settings",
  },
  SUBSCRIPTION: {
    BASE: "subscription",
    PRICING: "pricing",
    PROCESSING: "processing",
    CALLBACK: "callback",
    MANAGE: "manage",
  },
  PUBLIC: {
    ANAMNESIS_BASE: "/anamnesis/public",
  },
  FORM_SUBMISSIONS: "form-submissions",
};

// Navigation helpers (absolute paths for navigate())
export const ROUTES = {
  DASHBOARD: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DEMO: "/demo",
  CUSTOMERS: {
    BASE: "/customers",
    CREATE: "/customers/create",
    DETAILS: (customerId: string) => `/customers/${customerId}`,
    CREATEANAMNESIS: (customerId: string) => `/customers/${customerId}/create-anamnesis`,
    EDITANAMNESIS: (customerId: string, anamnesisId: string) => `/customers/${customerId}/edit-anamnesis/${anamnesisId}`
  },
  CONSULTAS: {
    BASE: "/consultas",
    CREATE: (customerId: string) => `/customers/${customerId}/consultas/create`,
    DETAILS: (customerId: string, consultaId: string) => `/customers/${customerId}/consultas/${consultaId}`,
  },
  FINANCES: {
    BASE: "/finances",
    DETAILS: (financeId: string) => `/finances/details/${financeId}`,
  },
  USER: {
    BASE: "/user",
    PROFILE: "/user/profile",
    SETTINGS: "/user/settings",
  },
  SUBSCRIPTION: {
    BASE: "/subscription",
    PRICING: "/subscription/pricing",
    PROCESSING: "/subscription/processing",
    CALLBACK: "/subscription/callback",
    MANAGE: "/subscription/manage",
  },
  PUBLIC: {
    ANAMNESIS_FORM: (token: string) => `/anamnesis/public/${token}`,
  },
  FORM_SUBMISSIONS: "/form-submissions",
};

// Export route paths for route definitions
export { ROUTE_PATHS };