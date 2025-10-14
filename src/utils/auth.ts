import { jwtDecode } from "jwt-decode";
import { TokenData } from "@/types/token";
import { getAuthData } from "./storage";

/**
 * @returns Token JWT decodificado
 */
export const getTokenData = (): TokenData | undefined => {
  try {
    return jwtDecode(getAuthData().access_token) as TokenData;
  } catch (err) {
    return undefined;
  }
};

/**
 * Verifica se o usuário está autenticado baseado na data de expiração do token
 * @returns boolean
 */
export const isAuthenticated = (): boolean => {
  const tokenData = getTokenData();
  return tokenData && tokenData.exp * 1000 > Date.now() ? true : false;
};

/**
 * Verifica se o usuário tem algum perfil em um dado array de perfis
 * @param roles - Array do tipo Perfil
 * @returns 
 */
export const hasAnyRoles = (roles: string[]): boolean => {
  const tokenData = getTokenData();

  if (tokenData !== undefined) {
    return roles.some((role) =>
      tokenData.authorities.includes(role)
    );
  }

  return false;
};
