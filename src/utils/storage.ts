import { User } from "@/types/user";

type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

/**
 * Authentication Data
 */
export const saveAuthData = (obj: LoginResponse) => {
  localStorage.setItem("authData", JSON.stringify(obj));
};

export const getAuthData = () => {
  const str = localStorage.getItem("authData") ?? "{}";
  return JSON.parse(str) as LoginResponse;
};

export const removeAuthData = () => {
  localStorage.removeItem("authData");
};

/**
 * User Data
 */
export const saveUserData = (obj: User) => {
  localStorage.setItem("userData", JSON.stringify(obj));
};

export const getUserData = () => {
  const str = localStorage.getItem("userData") ?? "{}";
  return JSON.parse(str) as User;
};

export const removeUserData = () => {
  localStorage.removeItem("userData");
};

/**
 * Sistema Operacional
 */
export const saveOS = (str: string) => {
  localStorage.setItem("OS", str);
}

export const getOS = () => {
  const str = localStorage.getItem("OS") ?? "Desconhecido";
}