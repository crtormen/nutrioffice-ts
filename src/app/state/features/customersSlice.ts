import { parse } from "date-fns";
import {
  // EntityId,
  // createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import { CustomersService } from "@/app/services/CustomersService";
import {
  ICustomer,
  ICustomerFirebase,
  IAddress,
} from "@/domain/entities/customer";
import { firestoreApi } from "../firestoreApi";
import { Timestamp } from "firebase/firestore";

// const customersAdapter = createEntityAdapter({
//   // selectId: (customer: ICustomer) => customer.id,
//   // sortComparer: (a, b) => a.name.localeCompare(b.name),
// });

// const initialState = customersAdapter.getInitialState();

// type normalizedCustomers = {
//   ids: string[];
//   entities: {
//     [key: string]: ICustomer;
//   };
// };

export const customersSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["Customers"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchCustomers: builder.query<ICustomer[], string | undefined>({
        providesTags: ["Customers"],
        keepUnusedDataFor: 3600,
        queryFn: () => ({ data: [] }),
        onCacheEntryAdded: async (
          uid,
          { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
        ) => {
          let unsubscribe;
          try {
            // wait for the initial query to resolve before proceeding
            await cacheDataLoaded;
            unsubscribe = CustomersService(uid)?.getAll((snapshot) => {
              let customers: ICustomer[] = [];

              customers = snapshot!.docs?.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));

              updateCachedData((draft) => {
                draft.push(...customers);
              });
            });
          } catch (err) {
            throw new Error("Something went wrong with customers.");
          }
          // cacheEntryRemoved will resolve when the cache subscription is no longer active
          await cacheEntryRemoved;
          // perform cleanup once the `cacheEntryRemoved` promise resolves
          unsubscribe && unsubscribe();
          // return unsubscribe;
        },
      }),
      fetchCustomersOnce: builder.query<ICustomer[], string | undefined>({
        queryFn: async (uid) => {
          try {
            if (!uid) return { data: [], isLoading: true };

            const querySnapshot = await CustomersService(uid)?.getAllOnce();
            const customers: ICustomer[] = [];

            querySnapshot?.forEach((doc) => {
              customers.push({
                id: doc.id,
                ...doc.data(),
              });
            });

            // customersAdapter.setAll(initialState, customers);
            return {
              data: customers,
            };
          } catch (err: unknown) {
            console.log("erro: ", err);
            return { error: err };
          }
        },
      }),
      fetchOneCustomer: builder.query({
        queryFn: async (id: string) => {
          try {
            return { data: null };
          } catch (err: any) {
            console.log("erro: ", err);
            return { error: err };
          }
        },
      }),
      addCustomer: builder.mutation<
        ICustomer,
        { uid: string; newCustomer: ICustomer }
      >({
        queryFn: async (arg) => {
          const { uid, newCustomer } = arg;
          const {
            name = "",
            email = "",
            phone = "",
            cpf = "",
            birthday = null,
            gender = "",
            occupation = "",
            instagram = "",
            credits = undefined,
            address = {} as IAddress,
          } = newCustomer;
          const customer: ICustomerFirebase = {
            name,
            email,
            phone,
            cpf,
            birthday: birthday
              ? Timestamp.fromDate(parse(birthday, "dd/MM/yyyy", new Date()))
              : undefined,
            gender,
            occupation,
            instagram,
            createdAt: Timestamp.now(),
            credits,
            address,
          };
          try {
            const response = await CustomersService(uid)?.addOne(customer);
            return { data: response && response };
          } catch (err: unknown) {
            console.log("erro: ", err);
            return { error: err };
          }
        },
      }),
      removeCustomer: builder.mutation({
        queryFn: async (id: string) => {
          try {
            return { data: null };
          } catch (err: any) {
            console.log("erro: ", err);
            return { error: err };
          }
        },
      }),
      editCustomer: builder.mutation({
        queryFn: async (customerData: ICustomer) => {
          try {
            return { data: null };
          } catch (err: any) {
            console.log("erro: ", err);
            return { error: err };
          }
        },
      }),
    }),
  });

export const selectCustomerById = (
  uid: string | undefined,
  customerId: string | undefined,
) => {
  // if (!uid || !customerId) return undefined;

  return createSelector(
    customersSlice.endpoints.fetchCustomers.select(uid),
    ({ data: customers }) =>
      customers?.filter((customer) => customer.id === customerId)[0],
  );
};

export const { useFetchCustomersOnceQuery, useFetchCustomersQuery } =
  customersSlice;

// export const selectCustomerById = (customerId: string) => {
//   return customersSlice.endpoints.fetchCustomers.select(customerId);
// };

// export const memoizedSelectorByCustomerId = createSelector(
//   selectCustomerById,
// )
//   useMemo(() => {
//     const selectCustomerCacheEntry =
//       customersSlice.endpoints.fetchCustomers.select(customerId);
//     return createSelector(
//       (state: RootState) => selectCustomerCacheEntry(state)?.data,
//       (cacheData) => {
//         return cacheData ? cacheData : initialState;
//       }
//     );
//   }, [customerId]);

// export const selectCustomersResult =
//   customersSlice.endpoints.fetchCustomers.select;

// const { selectAll, selectById, selectEntities, selectIds, selectTotal } =
//   customersAdapter.getSelectors((state: RootState) => state("Customers"));
// export const selectCustomersResult = customersSlice.endpoints.fetchCustomers.select(uid);
// const selectCustomersData = createSelector(
//   selectAll,
//   (customersResult) => customersResult.data
// );

// const selectCustomerById = createSelector(
//   selectById,
//   (customerResult) =>
// )

// export const {
//   selectAll: selectAllUsers,
//   selectById: selectUserById,
//   selectIds: selectUserIds,
// } = useAppSelector(selectCustomersData(state)) ??
// );
