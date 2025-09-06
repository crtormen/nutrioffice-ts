import { AuthError, AuthErrorCodes } from "firebase/auth";
import { toast } from "sonner";

const parseError = (error: AuthError): string => {
  switch (error?.code) {
    case AuthErrorCodes.INVALID_EMAIL: {
      return "Email inválido. Por favor forneça um email válido";
    }
    case AuthErrorCodes.INVALID_PASSWORD: {
      return "Senha Incorreta";
    }
    case AuthErrorCodes.USER_DELETED: {
      return "Usuário não encontrado";
    }
    case "auth/missing-password": {
      return "Forneça a senha";
    }
    case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER: {
      return "Muitas tentativas de login mal-sucedidas. Tente novamente mais tarde";
    }
    case AuthErrorCodes.POPUP_CLOSED_BY_USER: {
      return "Janela de login fechada pelo usuário";
    }
    case AuthErrorCodes.POPUP_BLOCKED: {
      return "Janela de login bloqueada pelo navegador. Desbloqueie os popus";
    }
    case AuthErrorCodes.EMAIL_EXISTS: {
      return "Endereço de email já utilizado. Faça login ou use outro email para o cadastro";
    }
    default:
      return "Erro ao efetuar login. Tente novamente.";
  }
};

export const generateFirebaseAuthError = (error: AuthError) => {
  const errorMessage = parseError(error);
  toast.error(errorMessage);
  return errorMessage;
};
