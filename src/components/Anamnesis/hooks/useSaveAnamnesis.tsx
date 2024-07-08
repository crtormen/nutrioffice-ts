import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import * as zod from "zod";

import {
  useAddAnamnesisMutation,
  useFetchAnamnesisQuery,
} from "@/app/state/features/anamnesisSlice";
import { IAnamnesis } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

export const useSaveAnamnesis = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [addAnamnesis, { isLoading: isSaving }] = useAddAnamnesisMutation();
  const { refetch } = useFetchAnamnesisQuery({
    uid: user?.uid,
    customerId: id,
  });
  const navigate = useNavigate();

  const handleNewAnamnesis = useCallback(
    (data: Record<string, zod.ZodTypeAny>) => {
      let anamnesis: IAnamnesis = {};

      // transform radio, checkbox and multiple-selector values into array of strings
      for (const field in data) {
        if (!data[field]) continue;
        anamnesis = {
          ...anamnesis,
          [field]:
            typeof data[field] === "object"
              ? Object.values(data[field]).map((item) => item.value)
              : data[field],
        };
      }

      addAnamnesis({ uid: user!.uid, customerId: id!, newAnamnesis: anamnesis })
        .unwrap()
        .then(() => {
          toast.success("Anamnese cadastrada com sucesso!");
          navigate(`/customers/${id}/anamnesis`, {
            replace: true,
            state: { refetch: true },
          });
          refetch();
        })
        .catch((error: unknown) => {
          console.error(error);
          toast.error(
            "Ocorreu um erro no cadastro da anamnese, tente novamente",
          );
        });
    },
    [],
  );

  return { handleNewAnamnesis, isSaving };
};
