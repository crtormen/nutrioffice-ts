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
  },
  USER: {
    BASE: "user",
    PROFILE: "user/profile",
    SETTINGS: "user/settings",
  },
  SUBSCRIPTION: {
    BASE: "subscription",
    PRICING: "subscription/pricing",
    CALLBACK: "subscription/callback",
  },
};