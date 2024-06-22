// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "@/assets/global.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import NotFoundPage from "@/pages/infra/NotFoundPage";

import AppRouter from "./app/router/AppRouter";
import { store } from "./app/state/store";
import { ThemeProvider } from "./components/theme/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./infra/firebase";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ReduxProvider store={store}>
        <BrowserRouter>
          <ThemeProvider storageKey="nutrioffice-theme" defaultTheme="light">
            <Toaster richColors />
            <main className="App min-h-screen">
              <Routes>
                <Route
                  path="/*"
                  element={<AppRouter />}
                  errorElement={<NotFoundPage />}
                />
              </Routes>
            </main>
          </ThemeProvider>
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </BrowserRouter>
      </ReduxProvider>
    </AuthProvider>
  </React.StrictMode>,
);
