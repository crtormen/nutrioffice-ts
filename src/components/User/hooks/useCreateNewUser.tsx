import { useCallback } from "react";

import { useSetUserMutation } from "@/app/state/features/userSlice";
import { IUser } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";
import { SignUpForm } from "@/pages/infra/SignUpPage";

export const useCreateNewUser = () => {
  const { createAccount } = useAuth();
  const [setUser, { isLoading: isSaving }] = useSetUserMutation();

  // Create an authentication account for user
  const createUser = useCallback((data: SignUpForm) => {
    return createAccount(
      data.email,
      data.password,
      // success callback
      async (res) => {
        const user: IUser = {
          ...data,
          roles: {
            ability: "PROFESSIONAL",
          },
        };
        // Create user collection in DB
        /* 
        When this action is completed, a function will be 
          executed by Google Functions, setting custom user claims. 
        */
        await setUser({ uid: res.user.uid, newUser: user });
        return user;
      },
      (err) => {
        return err;
      },
    );
  }, []);

  return { createUser, isSaving };
};
// criar conta auth
// cadastra usuário no BD
// carrega config default (anamnese, serviços, avaliação, tema)
