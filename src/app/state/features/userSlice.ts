import { createSelector } from "@reduxjs/toolkit";
import {
  DocumentData,
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

import { UserService } from "@/app/services/UserService";
import { IUser } from "@/domain/entities";

// import { dateInString } from "@/lib/utils";
import { firestoreApi } from "../firestoreApi";
import { RootStateType } from "../store";

export const userSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["User"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchUser: builder.query<IUser, string | undefined>({
        providesTags: (result, error, arg) => [{ type: "User", id: arg }],
        keepUnusedDataFor: 3600,
        queryFn: async (uid) => {
          if (!uid) return { data: undefined, error: "Args not provided" };

          try {
            const user = await UserService()?.getOne(uid);
            return {
              data: user,
            };
          } catch (err) {
            return { error: err };
          }
        },
      }),
      setUser: builder.mutation<IUser, { uid: string; newUser: IUser }>({
        invalidatesTags: (_result, _error, { uid }) => [{ type: "User", id: uid }],
        queryFn: async ({ uid, newUser }) => {
          try {
            // const dbUser = await UserService()?.getOne(uid);
            // // User data already exists
            // if (dbUser) {
            //   return { data: dbUser };
            // }

            await UserService()?.setOne(uid, newUser);

            return { data: newUser };
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
      addUser: builder.mutation<IUser, IUser>({
        invalidatesTags: ["User"],
        queryFn: async (newUser) => {
          try {
            const docRef = await UserService()?.addOne(newUser);
            if (!docRef) throw new TypeError("No docRef");

            const returnData: IUser = docRef?.withConverter({
              toFirestore({
                ...data
              }: PartialWithFieldValue<IUser>): DocumentData {
                return data;
              },
              fromFirestore(
                snapshot: QueryDocumentSnapshot<IUser>,
                options: SnapshotOptions,
              ): IUser {
                const data = snapshot.data(options);
                return {
                  ...data,
                  id: snapshot.id,
                  // createdAt: dateInString(data.createdAt)
                };
              },
            });
            return { data: returnData };
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
      updateUser: builder.mutation<
        IUser,
        { uid: string | undefined; updateData: IUser }
      >({
        invalidatesTags: (_result, _error, { uid }) => [{ type: "User", id: uid }],
        queryFn: async ({ uid, updateData }, api) => {
          if (!uid) return { error: "No UID provided" };

          const user = selectUserById(uid)(api.getState() as RootStateType);

          try {
            UserService()
              ?.updateOne(uid, updateData)
              .then(() => {
                return updateData;
              })
              .catch(() => {
                return { error: "ERRO" };
              });
            const returnData: IUser = {
              ...user,
              ...updateData,
            };
            return { data: returnData };
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
    }),
  });

export const selectUserById = (uid: string | undefined) => {
  // if (!uid || !customerId) return undefined;

  return createSelector(
    userSlice.endpoints.fetchUser.select(uid),
    ({ data: user }) => user,
  );
};

export const {
  useFetchUserQuery,
  useSetUserMutation,
  useAddUserMutation,
  useUpdateUserMutation,
} = userSlice;
