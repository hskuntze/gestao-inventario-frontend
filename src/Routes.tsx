import { Navigate, Route, Routes as Switch, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Auth from "@/pages/Auth";
import Home from "@/pages/Home";
import Ativo from "@/pages/Ativo";
import PrivateRoute from "./PrivateRoute";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "@/utils/contexts/AuthContext";
import Admin from "./pages/Admin";
import {} from "react-toastify";
import { Modal, Box } from "@mui/material";
import NaoEncontrado from "./pages/NaoEncontrado";
import PrimeiroAcesso from "./pages/PrimeiroAcesso";
import { getUserData } from "./utils/storage";
import { setupInterceptors } from "./utils/interceptor";
import NaoAutorizado from "./pages/NaoAutorizado";
import PageUsuario from "./pages/Usuario";
import { hasAnyRoles } from "./utils/auth";
import TrocarSenha from "./pages/TrocarSenha";

/**
 * Componente que controla as rotas da aplicação.
 * O prefixo definido para as rotas é "/gestao-inventario".
 * Utiliza o BrowserRouter, comum para aplicações web
 * e SPA (Single Page Applications), sendo capaz de
 * gerenciar o histórico de navegação.
 */
const Routes = () => {
  const userData = getUserData();
  const { authContextData } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isFirstAccess, setIsFirstAccess] = useState<boolean>(false);

  // Back button handler component (needs to be inside Router so hooks work)
  const BackButtonHandler = () => {
    const location = useLocation();

    // stack of visited location keys to determine if we can go back
    const stackRef = useRef<string[]>([location.key]);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    useEffect(() => {
      // push new location key into stack when location.key changes
      const current = stackRef.current;
      const last = current[current.length - 1];
      if (location.key !== last) {
        current.push(location.key);
      }
    }, [location.key]);

    useEffect(() => {
      const handleBack = () => {
        const stack = stackRef.current;
        if (stack.length > 1) {
          // navigate back in app history
          navigate(-1);
          // remove current key from stack
          stack.pop();
        } else {
          // at root of stack -> show confirmation modal
          setShowExitConfirm(true);
        }
      };

      // Register listener via global Capacitor App plugin if available at runtime
      try {
        const appPlugin = (window as any).Capacitor?.App;
        if (appPlugin && typeof appPlugin.addListener === "function") {
          const listener = appPlugin.addListener("backButton", handleBack);
          return () => {
            try {
              listener.remove();
            } catch (e) {
              // ignore
            }
          };
        }
      } catch (e) {
        // Capacitor App plugin not available in this environment (web)
      }
      // If no Capacitor App plugin, nothing to cleanup
      return () => {};
    }, []);

    const exitApp = () => {
      try {
        const appPlugin = (window as any).Capacitor?.App;
        if (appPlugin && typeof appPlugin.exitApp === "function") {
          appPlugin.exitApp();
        }
      } catch (e) {
        // no-op
      }
    };

    useEffect(() => {
      setupInterceptors(navigate);
    }, []);

    useEffect(() => {
      setIsFirstAccess(userData.firstAccess);
    }, []);

    useEffect(() => {
      const isUsuario = hasAnyRoles([{ id: 3, autorizacao: "PERFIL_USUARIO" }]);

      if (isUsuario) {
        navigate("/gestao-inventario/usuario");
      }
    });

    return (
      <>
        <Modal open={showExitConfirm} onClose={() => setShowExitConfirm(false)}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
              minWidth: 280,
            }}
          >
            <h3>Deseja sair do aplicativo?</h3>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="button" onClick={() => setShowExitConfirm(false)}>
                Cancelar
              </button>
              <button className="button" onClick={() => exitApp()}>
                Sair
              </button>
            </div>
          </Box>
        </Modal>
      </>
    );
  };

  return (
    <>
      <BackButtonHandler />
      {authContextData.authenticated && <Navbar />}
      <main id="main">
        <Switch>
          <Route path="/" element={<Navigate to="/gestao-inventario" />} />
          <Route path="/gestao-inventario/*" element={<Auth />} />
          <Route path="/gestao-inventario/nao-encontrado" element={<NaoEncontrado />} />
          <Route path="/gestao-inventario/nao-autorizado" element={<NaoAutorizado />} />
          <Route path="/gestao-inventario/primeiro-acesso" element={<PrimeiroAcesso />} />
          <Route path="/gestao-inventario/recuperar-senha" element={<TrocarSenha />} />
          <Route
            path="/gestao-inventario/usuario"
            element={
              <PrivateRoute
                roles={[
                  { id: 1, autorizacao: "PERFIL_ADMIN" },
                  { id: 3, autorizacao: "PERFIL_USUARIO" },
                ]}
                isFirstAccess={isFirstAccess}
              >
                <PageUsuario />
              </PrivateRoute>
            }
          />
          <Route
            path="/gestao-inventario"
            element={
              <PrivateRoute
                roles={[
                  { id: 1, autorizacao: "PERFIL_ADMIN" },
                  { id: 2, autorizacao: "PERFIL_ADMIN_TP" },
                  { id: 3, autorizacao: "PERFIL_USUARIO" },
                ]}
                isFirstAccess={isFirstAccess}
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
                  { id: 2, autorizacao: "PERFIL_ADMIN_TP" },
                  { id: 3, autorizacao: "PERFIL_USUARIO" },
                ]}
                isFirstAccess={isFirstAccess}
              >
                <Ativo />
              </PrivateRoute>
            }
          />
          <Route
            path="/gestao-inventario/admin/*"
            element={
              <PrivateRoute
                roles={[
                  { id: 1, autorizacao: "PERFIL_ADMIN" },
                  { id: 2, autorizacao: "PERFIL_ADMIN_TP" },
                ]}
                isFirstAccess={isFirstAccess}
              >
                <Admin />
              </PrivateRoute>
            }
          />
        </Switch>
      </main>
    </>
  );
};

export default Routes;
