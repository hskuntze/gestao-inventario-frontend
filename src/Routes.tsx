import { BrowserRouter, Navigate, Route, Routes as Switch } from "react-router-dom";
import { isAuthenticated } from "@/utils/auth";
import Navbar from "@/components/Navbar";
import Auth from "./pages/Auth";
import Home from "./pages/Home";

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
          {isAuthenticated() && <Route path="/gestao-inventario" element={<Home />} />}
        </Switch>
      </main>
    </BrowserRouter>
  );
};

export default Routes;
