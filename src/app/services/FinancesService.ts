import {
  DocumentData,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

import { IFinance, IFinanceFirebase, IPayment } from "@/domain/entities";
import { dateInString } from "@/lib/utils";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

const FinancesCollection = (uid: string, customerId: string) => {
  return uid
    ? createCollectionRef<IFinanceFirebase>(
        "users/" + uid + "/customers/" + customerId + "/finances",
      )
    : null;
};

export const FinancesService = (uid: string, customerId: string) => {
  const collection = FinancesCollection(uid, customerId);
  if (!collection) return;

  const financesService = new DatabaseService<IFinanceFirebase>(collection);

  financesService.query = query(
    collection.withConverter({
      toFirestore({ ...data }: PartialWithFieldValue<IFinance>): DocumentData {
        return data;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IFinanceFirebase>,
        options: SnapshotOptions,
      ): IFinance {
        const data = snapshot.data(options);
        const payments: IPayment[] | undefined = data.payments
          ? data.payments.map((payment) => ({
              ...payment,
              createdAt: dateInString(payment.createdAt),
            }))
          : undefined;
        const returnData = {
          id: snapshot.id,
          ...data,
          createdAt: dateInString(data.createdAt),
          payments,
        };
        return returnData;
      },
    }),
  );
  return financesService;
};
