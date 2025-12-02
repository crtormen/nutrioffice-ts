import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

export const firestoreApi = createApi({
  baseQuery: fakeBaseQuery(),
  tagTypes: [
    "Customers",
    "Consultas",
    "Finances",
    "CustomerFinances",
    "Anamnesis",
    "Avaliacoes",
    "Goals",
    "User",
    "Settings",
    "Analytics",
    "Subscription",
    "Invoices",
    "PaymentHistory",
  ],
  endpoints: () => ({}),
});
