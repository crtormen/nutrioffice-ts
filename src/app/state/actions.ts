import {
  CaseReducer,
  createSlice,
  PayloadAction,
  SliceCaseReducers,
  ValidateSliceCaseReducers,
} from "@reduxjs/toolkit";

interface GenericState<T> {
  data?: T;
  loading: "idle" | "pending" | "succeeded" | "failed";
}

export const createGenericSlice = <
  T,
  Reducers extends SliceCaseReducers<GenericState<T>>
>({
  name = "",
  initialState,
  reducers,
}: {
  name: string;
  initialState: GenericState<T>;
  reducers: ValidateSliceCaseReducers<GenericState<T>, Reducers>;
}) => {
  return createSlice({
    name,
    initialState,
    reducers: {
      start(state) {
        state.loading = "pending";
      },
      success(state: GenericState<T>, action: PayloadAction<T>) {
        state.data = action.payload;
        state.loading = "succeeded";
      },
      ...reducers,
    },
  });
};

// const add: CaseReducer<State, PayloadAction<T>> = (state, action) => {
//     state.customers.push(action.payload);
// }
