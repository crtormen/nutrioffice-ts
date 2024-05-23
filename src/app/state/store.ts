import { configureStore } from "@reduxjs/toolkit";
// import customersReducer from "./features/customers";
import { firestoreApi } from "./firestoreApi";

export const setupStore = () =>
  configureStore({
    reducer: {
      [firestoreApi.reducerPath]: firestoreApi.reducer,
      // customers: customersReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(firestoreApi.middleware),
  });

export const store = setupStore();
// console.log(store.getState().customers);
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export type AppStore = ReturnType<typeof setupStore>;
