import "./styles.css";
import { Link, useNavigate } from "react-router-dom";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useContext, useEffect, useRef, useState } from "react";
import { getUserData } from "@/utils/storage";

import CtceaLogoEscuro from "@/assets/images/Marca_Principal_Escuro.png";
import CtceaLogoClaro from "@/assets/images/Marca_Principal_Claro.png";
import { hasAnyRoles } from "@/utils/auth";
import { AuthContext } from "@/utils/contexts/AuthContext";

const Navbar = () => {
  const { setAuthContextData } = useContext(AuthContext);

  const [dropdown, setDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const navigate = useNavigate();
  const userData = getUserData();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminTp, setIsAdminTp] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute("data-theme") as "light" | "dark";
      setTheme(currentTheme || "dark");
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    setTheme((document.documentElement.getAttribute("data-theme") as "light" | "dark") || "dark");

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsAdmin(hasAnyRoles([{ id: 1, autorizacao: "PERFIL_ADMIN" }]));
    setIsAdminTp(hasAnyRoles([{ id: 2, autorizacao: "PERFIL_ADMIN_TP" }]));
  }, []);

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
        <ThemeSwitcher />
        <button className="navbar-button" onClick={() => setDropdown((prev) => !prev)}>
          <i className="bi bi-person" />
        </button>

        {dropdown && (
          <div className="user-dropdown" ref={dropdownRef} onMouseLeave={() => setDropdown(false)}>
            <div className="user-info">
              <strong>{userData.nome}</strong>
              <span>{userData.email}</span>
            </div>
            {!userData.firstAccess && (isAdmin || isAdminTp) && (
              <>
                <div className="dropdown-divider"></div>
                <div className="configurations">
                  <Link to={"/gestao-inventario/admin/cadastros"} type="button" className="configuration-button">
                    <i className="bi bi-gear-fill" />
                    <span>Cadastros</span>
                  </Link>

                  <Link to={"/gestao-inventario/admin/notificacoes"} type="button" className="configuration-button">
                    <i className="bi bi-bell-fill" />
                    <span>Notificações</span>
                  </Link>

                  <Link to={"/gestao-inventario/usuario"} type="button" className="configuration-button">
                    <i className="bi bi-person-lines-fill" />
                    <span>Meus Ativos</span>
                  </Link>

                  <Link to={"/gestao-inventario/solicitacao"} type="button" className="configuration-button">
                    <i className="bi bi-list-ul" />
                    <span>Solicitações</span>
                  </Link>
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
