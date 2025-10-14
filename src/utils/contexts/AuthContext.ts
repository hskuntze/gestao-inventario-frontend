import { createContext } from "react";
import { TokenData } from "@/types/token";

/**
 * Contexto de Autorização
 * - authenticated: se está, ou não, autenticado
 * - tokenData?: dados do token
 */
export type AuthContextData = {
  authenticated: boolean;
  tokenData?: TokenData;
};

export type AuthContextType = {
  authContextData: AuthContextData;
  setAuthContextData: (authContextData: AuthContextData) => void;
};

export const AuthContext = createContext<AuthContextType>({
  authContextData: {
    authenticated: false,
  },
  setAuthContextData: () => null,
});
