import Denied from "@/components/Denied";
import { Navigate, useLocation } from "react-router-dom";
import { hasAnyRoles, isAuthenticated } from "@/utils/auth";
import { Perfil } from "./types/perfil";

/**
 * Componente de segurança que é capaz de limitar os acessos
 * a determinadas páginas da aplicação. Recebe dois argumentos:
 * - children: JSX.Element >> componente que será exibido em tela
 * - roles: Array<Perfil> >> array de perfis que podem acessar 'children'
 *
 * Utiliza as funções "hasAnyRoles" e "isAuthenticated" para fazer este controle.
 */
interface PrivateRouteProps {
  children: React.ReactNode;
  roles: Perfil[];
  isFirstAccess: boolean; // Adicionada esta prop
}

const PrivateRoute = ({ children, roles, isFirstAccess }: PrivateRouteProps) => {
  const location = useLocation();

  const isAuth = isAuthenticated();
  const hasRoles = hasAnyRoles(roles);

  if (!isAuth) {
    return <Navigate to="/gestao-inventario/login" state={{ from: location }} replace />;
  }

  if (isFirstAccess && location.pathname !== "/gestao-inventario/primeiro-acesso") {
    return <Navigate to="/gestao-inventario/primeiro-acesso" replace />;
  }

  if (!isFirstAccess && location.pathname === "/gestao-inventario/primeiro-acesso") {
    return <Navigate to="/gestao-inventario" replace />;
  }

  if (isAuth && !hasRoles) {
    return <Denied />;
  }

  return children;
};

export default PrivateRoute;
