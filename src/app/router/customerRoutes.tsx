import React, { Suspense } from "react";
import { Route } from "react-router-dom";

import { ConsultaProvider } from "@/components/Consultas/context/ConsultaContext";
import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";
import { LoadingFallback } from "./LoadingFallback";

import { ROUTES } from "./routes";
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
  <Route path={ROUTES.CUSTOMERS.BASE}>
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
      path="create"
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
      path=":customerId/create-anamnesis"
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
      path=":customerId/edit-anamnesis/:anamnesisId"
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
      path=":customerId/consultas/create"
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
      path=":customerId/consultas/:consultaId/*"
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
