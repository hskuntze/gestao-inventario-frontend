import "./App.css";
import "bootstrap/dist/js/bootstrap.bundle";
import "react-toastify/ReactToastify.css";
import { useEffect, useState } from "react";
import { UserContext, UserContextData } from "@/utils/contexts/UserContext";
import { ToastContainer } from "react-toastify";
import { getOS, getUserData, saveOS } from "@/utils/storage";
import Routes from "./Routes";
import { AuthProvider } from "./utils/providers/AuthProvider";
import { BrowserRouter } from "react-router-dom";

function App() {
  const [userContextData, setUserContextData] = useState<UserContextData>({
    user: getUserData(),
  });

  function getSistemaOperacional() {
    const userAgent = window.navigator.userAgent.toLowerCase();

    if (userAgent.includes("windows")) return "Windows";
    if (userAgent.includes("mac")) return "macOS";
    if (userAgent.includes("linux")) return "Linux";
    if (userAgent.includes("android")) return "Android";
    if (userAgent.includes("iphone") || userAgent.includes("ipad")) return "iOS";

    return "Desconhecido";
  }

  useEffect(() => {
    let os = getOS();

    if (os === undefined) {
      saveOS(getSistemaOperacional());
    }
  }, []);

  return (
    <AuthProvider>
      <UserContext.Provider value={{ userContextData, setUserContextData }}>
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </UserContext.Provider>
    </AuthProvider>
  );
}

export default App;
