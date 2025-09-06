import "@/assets/global.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import NotFoundPage from "@/pages/infra/NotFoundPage";

import AppRouter from "./app/router/AppRouter";
import { store } from "./app/state/store";
import { ThemeProvider } from "./components/theme/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./infra/firebase";

const router = createBrowserRouter([
  {
    path: "/*",
    element: <AppRouter />,
    errorElement: <NotFoundPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ReduxProvider store={store}>
        <ThemeProvider storageKey="nutrioffice-theme" defaultTheme="light">
          <Toaster richColors />
          <main className="App min-h-screen">
            <RouterProvider router={router} />
          </main>
        </ThemeProvider>
      </ReduxProvider>
    </AuthProvider>
  </React.StrictMode>,
);
