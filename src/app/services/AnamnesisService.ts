import { IAnamnesis } from "@/domain/entities";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

const AnamnesisCollection = (uid: string, customerId: string) => {
  return uid
    ? createCollectionRef<IAnamnesis>(
        "users/" + uid + "/customers/" + customerId + "/anamnesis",
      )
    : null;
};

export const AnamnesisService = (uid: string, customerId: string) => {
  const collection = AnamnesisCollection(uid, customerId);
  if (!collection) return;

  const anamnesisService = new DatabaseService<IAnamnesis>(collection);

  anamnesisService.query = collection;

  return anamnesisService;
};
