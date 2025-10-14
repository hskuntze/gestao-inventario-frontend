
import "./styles.css";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const Navbar = () => {
  return (
    <nav className="navbar-container">
      <div className="navbar-div-left">
        <i className="bi bi-clipboard-check"></i>
        <h5>Gestão de Inventário</h5>
      </div>
      <div className="navbar-div-right">
        <ThemeSwitcher />
        <button className="navbar-button">
          <i className="bi bi-person" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
