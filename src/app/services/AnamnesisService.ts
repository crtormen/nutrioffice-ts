import { IAnamnesis } from "@/domain/entities";
import { DatabaseService, createCollection } from "./DatabaseService";

const AnamnesisCollection = (uid: string, customerId: string) => {
  return uid
    ? createCollection<IAnamnesis>(
        "users/" + uid + "/customers/" + customerId + "/anamnesis"
      )
    : null;
};

export const AnamnesisService = (uid: string, customerId: string) => {
  const collection = AnamnesisCollection(uid, customerId);
  if (!collection) return;

  const anamnesisService = new DatabaseService<IAnamnesis, IAnamnesis>(
    collection
  );

  anamnesisService.query = collection;

  return anamnesisService;
};
