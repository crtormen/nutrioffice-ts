import React, { Suspense } from "react";
import { Route } from "react-router-dom";

import { ConsultaProvider } from "@/components/Consultas/context/ConsultaContext";
import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";

import { LoadingFallback } from "./LoadingFallback";
import { ROUTE_PATHS } from "./routes";
const CustomersPage = React.lazy(
  () => import("@/pages/customers/CustomersPage"),
);
const CustomerDetailsPage = React.lazy(
  () => import("@/pages/customers/CustomerDetailsPage"),
);
const NewCustomerPage = React.lazy(
  () => import("@/pages/customers/NewCustomerPage"),
);
const NewAnamnesisPage = React.lazy(
  () => import("@/pages/anamnesis/NewAnamnesisPage"),
);
const EditAnamnesisPage = React.lazy(
  () => import("@/pages/anamnesis/EditAnamnesisPage"),
);
const ConsultaDetailsPage = React.lazy(
  () => import("@/pages/consultas/ConsultaDetailsPage"),
);
const NewConsultaPage = React.lazy(
  () => import("@/pages/consultas/NewConsultaPage"),
);

export const CustomerRoutes = (
  <Route path={ROUTE_PATHS.CUSTOMERS.BASE}>
    <Route
      index
      element={
        <RequireAuthLayout
          allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}
        >
          <Suspense fallback={<LoadingFallback />}>
            <CustomersPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
    <Route
      path={ROUTE_PATHS.CUSTOMERS.CREATE}
      element={
        <RequireAuthLayout
          allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}
        >
          <Suspense fallback={<LoadingFallback />}>
            <NewCustomerPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
    <Route
      path={`:customerId/${ROUTE_PATHS.CUSTOMERS.CREATE_ANAMNESIS}`}
      element={
        <RequireAuthLayout
          allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}
        >
          <Suspense fallback={<LoadingFallback />}>
            <NewAnamnesisPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
    <Route
      path={`:customerId/${ROUTE_PATHS.CUSTOMERS.EDIT_ANAMNESIS}/:anamnesisId`}
      element={
        <RequireAuthLayout
          allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}
        >
          <Suspense fallback={<LoadingFallback />}>
            <EditAnamnesisPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
    <Route
      path={`:customerId/${ROUTE_PATHS.CUSTOMERS.CONSULTAS.BASE}/${ROUTE_PATHS.CUSTOMERS.CONSULTAS.CREATE}`}
      element={
        <RequireAuthLayout
          allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}
        >
          <Suspense fallback={<LoadingFallback />}>
            <ConsultaProvider>
              <NewConsultaPage />
            </ConsultaProvider>
          </Suspense>
        </RequireAuthLayout>
      }
    />
    <Route
      path={`:customerId/${ROUTE_PATHS.CUSTOMERS.CONSULTAS.BASE}/:consultaId/*`}
      element={
        <RequireAuthLayout
          allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}
        >
          <Suspense fallback={<LoadingFallback />}>
            <ConsultaDetailsPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
    <Route
      path=":customerId/*"
      element={
        <RequireAuthLayout
          allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}
        >
          <Suspense fallback={<LoadingFallback />}>
            <CustomerDetailsPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
  </Route>
);
