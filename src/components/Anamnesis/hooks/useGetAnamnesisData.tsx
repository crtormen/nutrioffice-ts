import { useAppSelector } from "@/app/state";
import {
  selectAnamnesis,
  useFetchAnamnesisQuery,
} from "@/app/state/features/anamnesisSlice";
import { IAnamnesis } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

export const useGetAnamnesisData = (customerId: string | undefined) => {
  const { dbUid } = useAuth();

  useFetchAnamnesisQuery({
    uid: dbUid,
    customerId,
  });
  const selector = selectAnamnesis(dbUid, customerId);
  const anamnesisData: IAnamnesis | undefined = useAppSelector(selector);

  return anamnesisData;
};
