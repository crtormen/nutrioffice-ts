import { parse } from "date-fns";
import {
  createEntityAdapter,
  createSelector,
  EntityId,
} from "@reduxjs/toolkit";
import { CustomersService } from "@/app/services/CustomersService";
import { ICustomer, ICustomerFirebase, IAddress } from "@/domain/entities";
import { firestoreApi } from "../firestoreApi";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/infra/firebase";
import { RootState } from "../store";

const customersAdapter = createEntityAdapter<ICustomer>();
//   // selectId: (customer: ICustomer) => customer.id,
//   // sortComparer: (a, b) => a.name.localeCompare(b.name),
// });

const initialState = customersAdapter.getInitialState();

type normalizedCustomers = {
  ids: EntityId[];
  entities: {
    [key: string]: ICustomer;
  };
};

export const customersSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["Customers"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchCustomers: builder.query<normalizedCustomers, string | undefined>({
        providesTags: ["Customers"],
        keepUnusedDataFor: 3600,
        queryFn: () => ({ data: { ids: [], entities: {} } }),
        onCacheEntryAdded: async (
          uid,
          { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
        ) => {
          let unsubscribe;
          try {
            // wait for the initial query to resolve before proceeding
            await cacheDataLoaded;
            unsubscribe = CustomersService(uid)?.getAll((snapshot) => {
              let customers: normalizedCustomers;
              let ids: EntityId[] = [];
              let entities: {
                [key: string]: ICustomer;
              } = {};

              ids = snapshot!.docs?.map((doc) => {
                entities = {
                  ...entities,
                  [doc.id]: {
                    id: doc.id,
                    ...doc.data(),
                  },
                };
                return doc.id;
              });

              customers = {
                ids,
                entities,
              };

              updateCachedData((draft) => {
                draft = customersAdapter.setAll(initialState, entities);
                // draft = customers;
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
            let customers: ICustomer[] = [];

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
          } catch (err: any) {
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
          } catch (err: any) {
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

// export const selectCustomerById = (uid: string, customerId: string) =>
//   createSelector(
//     customersSlice.endpoints.fetchCustomers.select(uid),
//     ({ data: customers }) =>
//       customers?.filter((customer) => customer.id === customerId)[0]
//   );

export const selectCustomersResult =
  customersSlice.endpoints.fetchCustomers.select(useAuth().user?.uid);

const selectCustomersData = createSelector(
  selectCustomersResult,
  (customersResult) => customersResult.data
);

export const { selectAll: selectAllCustomers, selectById: selectCustomerById } =
  customersAdapter.getSelectors(
    (state: RootState) => selectCustomersData(state) ?? initialState
  );
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
