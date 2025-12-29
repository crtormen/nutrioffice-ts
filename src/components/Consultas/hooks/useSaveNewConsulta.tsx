import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { ROUTES } from "@/app/router/routes";
import { useAddConsultaMutation } from "@/app/state/features/consultasSlice";
import {
  useAddCustomerConsultaMutation,
  useUpdateCustomerConsultaMutation,
} from "@/app/state/features/customerConsultasSlice";
import { useGetCustomerData } from "@/components/Customers/hooks";
import { IConsulta, type ICustomerConsulta } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

export const useSaveNewConsulta = () => {
  const { dbUid } = useAuth();
  const navigate = useNavigate();
  const { customerId } = useParams();
  const customer = useGetCustomerData(customerId);
  const [addCustomerConsulta, { isLoading: isSaving }] =
    useAddCustomerConsultaMutation();
  const [updateCustomerConsulta, { isLoading: isUpdating }] =
    useUpdateCustomerConsultaMutation();
  const [addConsulta] = useAddConsultaMutation();

  const handleCreateNewConsulta = useCallback(
    async (consulta: ICustomerConsulta) => {
      console.log("Consulta: ", consulta);

      try {
        const response = await addCustomerConsulta({
          uid: dbUid,
          customerId,
          newConsulta: consulta,
        }).unwrap();

        return response.id;
      } catch (err) {
        throw new Error(err as string);
      }
    },
    [addCustomerConsulta, customerId, dbUid],
  );

  const handleUpdateConsulta = useCallback(
    async (consulta: ICustomerConsulta) => {
      try {
        await updateCustomerConsulta({
          uid: dbUid,
          customerId,
          consulta,
        });

        if (consulta.pending) {
          // consulta isn't ready yet, so don't write to /users/consulta collection
          return;
        }

        // User has finished consulta creation/edition and now we are ready to write
        const consulta2: IConsulta = {
          id: consulta.id,
          customer_id: customerId,
          date: consulta.date,
          gender: customer?.gender,
          idade: consulta.idade,
          name: customer?.name,
          peso: consulta.peso,
          results: consulta.results,
        } as IConsulta;

        addConsulta({ uid: dbUid, newConsulta: consulta2 })
          .then(
            () => customerId && navigate(ROUTES.CUSTOMERS.DETAILS(customerId)),
          )
          .catch((err) => {
            toast.error("Um erro ocorreu ao cadastrar a consulta.");
            throw new Error(err);
          });
      } catch (error) {
        toast.error("Um erro ocorreu ao cadastrar a consulta no cliente.");
        throw new Error(error as string);
      }
    },
    [
      addConsulta,
      customer?.gender,
      customer?.name,
      customerId,
      dbUid,
      navigate,
      updateCustomerConsulta,
    ],
  );

  return {
    handleCreateNewConsulta,
    handleUpdateConsulta,
    isSaving,
    isUpdating,
  };
};
