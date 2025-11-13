import Denied from "@/components/Denied";
import { JSX } from "react";
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
const PrivateRoute = ({ children, roles }: { children: JSX.Element; roles: Array<Perfil> }) => {
  const location = useLocation();

  const isAuth = isAuthenticated();
  const hasRoles = hasAnyRoles(roles);

  if (!isAuth) {
    return <Navigate to="/gestao-inventario/login" state={{ from: location }} replace />;
  }

  if (isAuth && !hasRoles) {
    return <Denied />;
  }

  return children;
};

export default PrivateRoute;
