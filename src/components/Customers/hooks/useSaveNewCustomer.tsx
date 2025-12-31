import { format } from "date-fns";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ROUTES } from "@/app/router/routes";
import { useAddCustomerMutation } from "@/app/state/features/customersSlice";
import { ICustomer } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";
import { newCustomerFormInputs } from "@/pages/customers/NewCustomerPage";

export const useSaveNewCustomer = () => {
  const navigate = useNavigate();
  const [addCustomer, { isLoading: isSaving }] = useAddCustomerMutation();
  const { dbUid } = useAuth();

  const handleSaveNewCustomer = useCallback(
    (data: newCustomerFormInputs) => {
      const customer: ICustomer = {
        address: {
          street: data.street,
          cep: data.cep,
          district: data.district,
          city: data.city,
        },
        name: data.name,
        cpf: data.cpf,
        gender: data.gender,
        birthday: format(data.birthday, "dd/MM/yyyy"),
        email: data.email,
        phone: data.phone,
        occupation: data.occupation,
        instagram: data.instagram,
        cameBy: data.cameBy,
      };
      addCustomer({ uid: dbUid, newCustomer: customer })
        .unwrap()
        .then((dataRef) => {
          toast.success("Cliente cadastrado com sucesso!");
          // Small delay to allow real-time listener to update cache
          setTimeout(() => {
            navigate(ROUTES.CUSTOMERS.DETAILS(dataRef.id), { replace: true });
          }, 300);
        })
        .catch((error) => {
          console.error(error);
          toast.error(
            "Ocorreu um erro no cadastro do cliente, tente novamente",
          );
        });
    },
    [addCustomer, dbUid, navigate],
  );

  return { handleSaveNewCustomer, isSaving };
};
