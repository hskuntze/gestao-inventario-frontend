import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} type="button" className="navbar-button">
      {theme === "light" ? <i className="bi bi-brightness-high" /> : <i className="bi bi-moon" />}
    </button>
  );
};

export default ThemeSwitcher;
