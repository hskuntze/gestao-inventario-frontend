import "./styles.css";
import { Link, useNavigate } from "react-router-dom";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useEffect, useRef, useState } from "react";
import { getUserData } from "@/utils/storage";

import CtceaLogoEscuro from "@/assets/images/Marca_Principal_Escuro.png";
import CtceaLogoClaro from "@/assets/images/Marca_Principal_Claro.png";

const Navbar = () => {
  const [dropdown, setDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const navigate = useNavigate();
  const userData = getUserData();

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

  const handleLogout = () => {
    // Exemplo: limpa o token e redireciona
    localStorage.removeItem("authData");
    navigate("/gestao-inventario");
  };

  return (
    <nav className="navbar-container">
      <Link to="/gestao-inventario" style={{ display: "flex" }}>
        <div className="navbar-div-left">
          <img src={theme === "light" ? CtceaLogoClaro : CtceaLogoEscuro} alt="Logotipo CTCEA" className="navbar-img" />
          <h5>Gestão de Inventário</h5>
        </div>
      </Link>
      <div className="navbar-div-right">
        <ThemeSwitcher />
        <button className="navbar-button" onClick={() => setDropdown((prev) => !prev)}>
          <i className="bi bi-person" />
        </button>

        {dropdown && (
          <div className="user-dropdown">
            <div className="user-info">
              <strong>{userData.nome}</strong>
              <span>{userData.email}</span>
            </div>
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
