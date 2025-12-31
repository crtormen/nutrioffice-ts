import React, { Suspense } from "react";
import { Route } from "react-router-dom";

import { ConsultaProvider } from "@/components/Consultas/context/ConsultaContext";
import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";

import { LoadingFallback } from "./LoadingFallback";
import { ROUTE_PATHS } from "./routes";

const ConsultasPage = React.lazy(
  () => import("@/pages/consultas/ConsultasPage"),
);
const NewConsultaPage = React.lazy(
  () => import("@/pages/consultas/NewConsultaPage"),
);
const ConsultaDetailsPage = React.lazy(
  () => import("@/pages/consultas/ConsultaDetailsPage"),
);

export const ConsultaRoutes = (
  <Route path={ROUTE_PATHS.CONSULTAS.BASE}>
    <Route
      index
      element={
        <RequireAuthLayout
          allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}
        >
          <Suspense fallback={<LoadingFallback />}>
            <ConsultasPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
    <Route
      path=":customerId/create"
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
      path=":customerId/:consultaId/*"
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
  </Route>
);
