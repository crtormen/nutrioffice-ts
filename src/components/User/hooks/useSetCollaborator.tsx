import { useCallback } from "react";
import { toast } from "sonner";

import {
  useFetchUserQuery,
  useSetUserMutation,
  useUpdateUserMutation,
} from "@/app/state/features/userSlice";
import { IUser } from "@/domain/entities";
import { createAuthUser, useAuth } from "@/infra/firebase";

import { newCollaboratorFormInputs } from "../SetCollaboratorDialog";

const useSetCollaborator = (setDialogOpen: (isOpen: boolean) => void) => {
  const auth = useAuth();
  const { data: user, refetch } = useFetchUserQuery(auth.user?.uid);
  const [setCollaborator] = useSetUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const handleSetCollaborator = useCallback(
    (data: newCollaboratorFormInputs) => {
      if (!data) return;
      let collaboratorUid: string | undefined;
      const collaborator: IUser = {
        name: data.name,
        email: data.email,
        phone: data.phone ? `+55${data.phone}` : "",
        roles: data.roles
          ? {
              ability: data.roles,
            }
          : undefined,
        contributesTo: auth.user?.uid,
      };

      for (const key in user?.contributors) {
        if (user?.contributors[key]?.email === data.email) {
          // collaborator already exists
          setDialogOpen(false);
          toast.error("Já existe um colaborador com esse endereço de email.");
          return;
        }
      }

      // Call Firebase Function to create a user in authentication server
      createAuthUser(collaborator)
        .then((result) => {
          if (!result.data) {
            setDialogOpen(false);
            throw new Error("No data returned from auth create user");
          }

          collaboratorUid = result.data as string;
          // Create a document in firestore user's collection to the collaborator
          setCollaborator({ uid: collaboratorUid, newUser: collaborator })
            .unwrap()
            .then(() => {
              setDialogOpen(false);
              toast.success("Colaborador cadastrado com sucesso!");
            })
            .catch((error: unknown) => {
              console.error(error);
              toast.error(
                "Ocorreu um erro no cadastro do colaborador, tente novamente",
              );
              setDialogOpen(false);
              throw new Error(
                "Ocorreu um erro no cadastro do colaborador, tente novamente",
              );
            });
          // Then, update admin user with new collaborator in "contributors" record
          const updatedUser: IUser = {
            contributors: {
              ...user?.contributors,
              [collaboratorUid]: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                roles: data.roles || "COLLABORATOR",
              },
            },
          };
          // Update user's collaborators list
          updateUser({ uid: auth.user?.uid, updateData: updatedUser }).then(
            () => refetch(), // update cache
          );
          setDialogOpen(false);
        })
        .catch((error) => {
          const { code, details } = JSON.parse(JSON.stringify(error));
          toast.error(
            "Ocorreu um erro no cadastro do colaborador, tente novamente",
          );
          console.log("Error: ", code, details);
          setDialogOpen(false);
          throw new Error(
            "Ocorreu um erro no cadastro do colaborador, tente novamente",
          );
        });
      setDialogOpen(false);
    },
    [],
  );

  return { handleSetCollaborator };
};

export default useSetCollaborator;
