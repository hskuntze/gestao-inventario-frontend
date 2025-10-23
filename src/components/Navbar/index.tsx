import { Link, useNavigate } from "react-router-dom";
import "./styles.css";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useEffect, useRef, useState } from "react";
import { getUserData } from "@/utils/storage";

const Navbar = () => {
  const [dropdown, setDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const userData = getUserData();

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
          <i className="bi bi-clipboard-check"></i>
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
              <strong>{userData.username}</strong>
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
