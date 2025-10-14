import Denied from "@/components/Denied";
import { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { hasAnyRoles, isAuthenticated } from "@/utils/auth";

/**
 * Componente de segurança que é capaz de limitar os acessos
 * a determinadas páginas da aplicação. Recebe dois argumentos:
 * - children: JSX.Element >> componente que será exibido em tela
 * - roles: Array<Perfil> >> array de perfis que podem acessar 'children'
 * 
 * Utiliza as funções "hasAnyRoles" e "isAuthenticated" para fazer este controle.
 */
const PrivateRoute = ({
    children,
    roles,
  }: {
    children: JSX.Element;
    roles: Array<string>;
  }) => {
    let location = useLocation();
  
    const hasRoles = hasAnyRoles(roles);
  
    if (!isAuthenticated()) {
      return <Navigate replace to="/gestao-inventario/login" state={{ from: location }} />;
    }
  
    if (isAuthenticated() && !hasRoles) {
      return <Denied />;
    }
  
    return children;
  };
  
  export default PrivateRoute;