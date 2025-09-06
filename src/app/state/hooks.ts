import { useDispatch, useSelector, useStore } from "react-redux";

import type { AppDispatchType, AppStoreType, RootStateType } from "./store";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatchType>();
export const useAppSelector = useSelector.withTypes<RootStateType>();
export const useAppStore = useStore.withTypes<AppStoreType>();
