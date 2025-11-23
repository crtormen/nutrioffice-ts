import React from "react";
import { Route } from "react-router-dom";
import { ConsultaProvider } from "@/components/Consultas/context/ConsultaContext";
const ConsultasPage = React.lazy(() => import("@/pages/consultas/ConsultasPage"));
const NewConsultaPage = React.lazy(() => import("@/pages/consultas/NewConsultaPage"));
const ConsultaDetailsPage = React.lazy(() => import("@/pages/consultas/ConsultaDetailsPage"));
import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";
import { ROUTES } from "./routes";

export const ConsultaRoutes = (
  <Route path={ROUTES.CONSULTAS.BASE}>
    <Route index element={
      <RequireAuthLayout allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}>      
        <ConsultasPage />
      </RequireAuthLayout>
    } />
    <Route
      path=":customerId/create"
      element={
      <RequireAuthLayout allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}>
        <ConsultaProvider>
          <NewConsultaPage />
        </ConsultaProvider>
      </RequireAuthLayout>
      }
    />
    <Route
      path=":customerId/:consultaId/*"
      element={
        <RequireAuthLayout allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}>
          <ConsultaDetailsPage />
        </RequireAuthLayout>
      }
    />
  </Route>
);