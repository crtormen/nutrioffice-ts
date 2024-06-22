import { configureStore } from "@reduxjs/toolkit";

// import customersReducer from "./features/customers";
import { firestoreApi } from "./firestoreApi";

export const setupStore = () =>
  configureStore({
    reducer: {
      [firestoreApi.reducerPath]: firestoreApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(
        firestoreApi.middleware,
      ),
  });

export const store = setupStore();

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootStateType = ReturnType<typeof store.getState>;
export type AppDispatchType = typeof store.dispatch;
export type AppStoreType = ReturnType<typeof setupStore>;
