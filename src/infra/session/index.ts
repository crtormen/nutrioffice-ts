import { User } from "firebase/auth";

export const startSession = (user: User, token: string | undefined) => {
  user.email && sessionStorage.setItem("@AuthFirebase:Email", user.email);
  token && sessionStorage.setItem("@AuthFirebase:Token", token);
};

export const getSession = () => {
  return {
    email: sessionStorage.getItem("@AuthFirebase:Email"),
    accessToken: sessionStorage.getItem("@AuthFirebase:Token"),
  };
};

export const endSession = () => {
  sessionStorage.clear();
};

export const isLoggedIn = () => {
  return getSession().accessToken;
};
