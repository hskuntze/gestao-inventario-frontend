import "./styles.css";
import { Link, useNavigate } from "react-router-dom";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { getUserData } from "@/utils/storage";

import CtceaLogoEscuro from "@/assets/images/Marca_Principal_Escuro.png";
import CtceaLogoClaro from "@/assets/images/Marca_Principal_Claro.png";
import { hasAnyRoles } from "@/utils/auth";
import { AuthContext } from "@/utils/contexts/AuthContext";
import { useClickOutside } from "@/utils/hooks/useClickOutside";

const Navbar = () => {
  const { setAuthContextData } = useContext(AuthContext);

  const [dropdown, setDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const navigate = useNavigate();
  const userData = getUserData();

  const isAdmin = hasAnyRoles([{ id: 1, autorizacao: "PERFIL_ADMIN" }]);
  const isAnalista = hasAnyRoles([
    { id: 2, autorizacao: "PERFIL_ADMIN_TP" },
    { id: 5, autorizacao: "PERFIL_ANALISTA_TI" },
    { id: 6, autorizacao: "PERFIL_ANALISTA_ADMINISTRACAO_I" },
    { id: 7, autorizacao: "PERFIL_ANALISTA_ADMINISTRACAO_II" },
    { id: 8, autorizacao: "PERFIL_ANALISTA_DOC" },
  ]);
  const isGerente = hasAnyRoles([{ id: 3, autorizacao: "PERFIL_GERENTE" }]);
  const isUsuario = hasAnyRoles([{ id: 4, autorizacao: "PERFIL_USUARIO" }]);

  // Observa as mudanças de tema (claro | escuro) no site
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute("data-theme") as "light" | "dark";
      setTheme(currentTheme || "dark");
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    setTheme((document.documentElement.getAttribute("data-theme") as "light" | "dark") || "dark");

    return () => observer.disconnect();
  }, []);

  const handleCloseDropdown = useCallback(() => {
    setDropdown(false);
  }, []);

  useClickOutside(dropdownRef, handleCloseDropdown);

  // Exclui os elementos salvos no localStorage
  const handleLogout = () => {
    localStorage.removeItem("authData");
    localStorage.removeItem("userData");

    setAuthContextData({
      authenticated: false,
      tokenData: undefined,
    });

    navigate("/gestao-inventario");
  };

  return (
    <nav className="navbar-container">
      {/* Caso seja o primeiro acesso do usuário, o logo não é link */}
      {userData.firstAccess ? (
        <div className="navbar-div-left">
          <img src={theme === "light" ? CtceaLogoClaro : CtceaLogoEscuro} alt="Logotipo CTCEA" className="navbar-img" />
          <h5>Gestão de Inventário</h5>
        </div>
      ) : (
        <Link to="/gestao-inventario" style={{ display: "flex" }}>
          <div className="navbar-div-left">
            <img src={theme === "light" ? CtceaLogoClaro : CtceaLogoEscuro} alt="Logotipo CTCEA" className="navbar-img" />
            <h5>Gestão de Inventário</h5>
          </div>
        </Link>
      )}
      <div className="navbar-div-right">
        {/* Componente que muda o tema do site */}
        <ThemeSwitcher />
        <button className="navbar-button" onClick={() => setDropdown((prev) => !prev)}>
          <i className="bi bi-person" />
        </button>

        {dropdown && (
          <div className="user-dropdown" ref={dropdownRef}>
            <div className="user-info">
              <strong>{userData.nome}</strong>
              <span>{userData.email}</span>
            </div>
            {!userData.firstAccess && (
              <>
                <div className="dropdown-divider"></div>

                {/* Mostra as opções do menu de acordo com o perfil do usuário */}
                <div className="configurations">
                  {(isAdmin || isAnalista) && (
                    <>
                      <Link to="/gestao-inventario/admin/cadastros" className="configuration-button">
                        <i className="bi bi-gear-fill" />
                        <span>Cadastros</span>
                      </Link>

                      <Link to="/gestao-inventario/admin/notificacoes" className="configuration-button">
                        <i className="bi bi-bell-fill" />
                        <span>Notificações</span>
                      </Link>
                    </>
                  )}

                  {(isAdmin || isAnalista || isUsuario) && (
                    <Link to="/gestao-inventario/usuario" className="configuration-button">
                      <i className="bi bi-person-lines-fill" />
                      <span>Meus Ativos</span>
                    </Link>
                  )}

                  {isGerente && (
                    <Link to="/gestao-inventario/solicitacao" className="configuration-button">
                      <i className="bi bi-list-ul" />
                      <span>Solicitações</span>
                    </Link>
                  )}
                </div>
              </>
            )}
            <div className="dropdown-divider"></div>
            <button className="dropdown-item" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i> Sair
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
