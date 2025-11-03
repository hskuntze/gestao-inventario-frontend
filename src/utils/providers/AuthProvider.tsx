import { useEffect, useState } from "react";
import { getTokenData, isAuthenticated } from "../auth";
import { AuthContext, AuthContextData } from "@/utils/contexts/AuthContext";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authContextData, setAuthContextData] = useState<AuthContextData>({
    authenticated: isAuthenticated(),
    tokenData: getTokenData(),
  });

  // Atualiza o estado quando o localStorage muda (logout manual, aba diferente, etc)
  useEffect(() => {
    const syncAuth = () => {
      setAuthContextData({
        authenticated: isAuthenticated(),
        tokenData: getTokenData(),
      });
    };

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  return (
    <AuthContext.Provider value={{ authContextData, setAuthContextData }}>
      {children}
    </AuthContext.Provider>
  );
};