export const ROUTES = {
  DASHBOARD: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DEMO: "/demo",
  CUSTOMERS: {
    BASE: "customers",
    CREATE: "customers/create",
    DETAILS: (customerId: string) => `customers/${customerId}`,
  },
  CONSULTAS: {
    BASE: "consultas",
    CREATE: (customerId: string) => `consultas/${customerId}/create`,
    DETAILS: (customerId: string, consultaId: string) => `consultas/${customerId}/${consultaId}`,
  },
  ANAMNESIS: {
    BASE: "anamnesis"
  },
  USER: {
    BASE: "user",
    PROFILE: "user/profile",
    SETTINGS: "user/settings",
  },
};