import {
  createSlice,
  PayloadAction,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import { RootState } from "../store";
import { ICustomer } from "@/domain/entities/customer";

// interface CustomersState {
//   ids: string[];
//   customers: Customer[];
//   loading: "idle" | "pending" | "succeeded" | "failed";
// }
// const initialState: CustomersState = {
//   ids: [],
//   customers: {},
//   loading: "idle"
// };

export const customersAdapter = createEntityAdapter({
  // selectID: (customer) => customer.id,
  // sortComparer: (a, b) => a.name.localeCompare(b.name),
});

const customersSlice = createSlice({
  name: "customers",
  initialState: customersAdapter.getInitialState({
    loading: "idle",
  }),
  reducers: {
    addCustomer: customersAdapter.addOne,
    removeCustomer: customersAdapter.removeOne,
    editCustomer: customersAdapter.updateOne,
    setCustomer: customersAdapter.setOne,
    setCustomers: customersAdapter.setAll,
    editCredits: customersAdapter.upsertOne,
    start(state) {
      state.loading = "pending";
    },
  },
});

// export const customersSelectors = customersAdapter.getSelectors<RootState>(
//   (state) => state.customers
// );

// export const allCustomers = customersSelectors.selectAll;

export default customersSlice.reducer;
