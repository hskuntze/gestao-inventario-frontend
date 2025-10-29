import { BrowserRouter, Navigate, Route, Routes as Switch } from "react-router-dom";
import { isAuthenticated } from "@/utils/auth";
import Navbar from "@/components/Navbar";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Ativo from "./pages/Ativo";
import PrivateRoute from "./PrivateRoute";

/**
 * Componente que controla as rotas da aplicação.
 * O prefixo definido para as rotas é "/gestao-inventario".
 * Utiliza o BrowserRouter, comum para aplicações web
 * e SPA (Single Page Applications), sendo capaz de
 * gerenciar o histórico de navegação.
 */
const Routes = () => {
  return (
    <BrowserRouter>
      {isAuthenticated() && <Navbar />}
      <main id="main">
        <Switch>
          <Route path="/" element={<Navigate to="/gestao-inventario" />} />
          <Route path="/gestao-inventario/*" element={<Auth />} />
          <Route
            path="/gestao-inventario"
            element={
              <PrivateRoute
                roles={[
                  { id: 1, autorizacao: "PERFIL_ADMIN" },
                  { id: 2, autorizacao: "PERFIL_GERENTE" },
                  { id: 3, autorizacao: "PERFIL_USUARIO" },
                ]}
              >
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/gestao-inventario/ativo/*"
            element={
              <PrivateRoute
                roles={[
                  { id: 1, autorizacao: "PERFIL_ADMIN" },
                  { id: 2, autorizacao: "PERFIL_GERENTE" },
                  { id: 3, autorizacao: "PERFIL_USUARIO" },
                ]}
              >
                <Ativo />
              </PrivateRoute>
            }
          />
        </Switch>
      </main>
    </BrowserRouter>
  );
};

export default Routes;