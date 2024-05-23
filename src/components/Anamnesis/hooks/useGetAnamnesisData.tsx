import { useAuth } from "@/infra/firebase";
import { useAppSelector } from "@/app/state";
import {
  selectAnamnesis,
  useFetchAnamnesisQuery,
} from "@/app/state/features/anamnesisSlice";
import { IAnamnesis } from "@/domain/entities";

export const useGetAnamnesisData = (customerId: string | undefined) => {
  const auth = useAuth();
  const uid = auth.user?.uid;
  if (!customerId || !uid) return;

  const anamnesis = useFetchAnamnesisQuery({ uid, customerId });
  const selector = selectAnamnesis(uid, customerId);
  const anamnesisData: IAnamnesis | undefined = useAppSelector(selector);

  return anamnesisData;
};
