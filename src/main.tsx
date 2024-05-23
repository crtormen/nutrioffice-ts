import React from "react";
import ReactDOM from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppRouter from "./app/router/AppRouter";
import { store } from "./app/state/store";
import { AuthProvider } from "./infra/firebase";
import NotFoundPage from "@/pages/infra/NotFoundPage";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import "@/assets/global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ReduxProvider store={store}>
        <BrowserRouter>
          <main className="App min-h-screen">
            <Routes>
              <Route
                path="/*"
                element={<AppRouter />}
                errorElement={<NotFoundPage />}
              />
            </Routes>
          </main>
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </BrowserRouter>
      </ReduxProvider>
    </AuthProvider>
  </React.StrictMode>
);
