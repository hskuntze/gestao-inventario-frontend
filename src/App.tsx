import "bootstrap/dist/js/bootstrap.bundle";
import "react-toastify/ReactToastify.css";
import './App.css';
import { useState } from 'react';
import { AuthContext, AuthContextData } from "@/utils/contexts/AuthContext";
import { UserContext, UserContextData } from "@/utils/contexts/UserContext";
import { ToastContainer } from "react-toastify";
import { getUserData } from "@/utils/storage";
import Routes from "./Routes";

function App() {
  const [authContextData, setAuthContextData] = useState<AuthContextData>({
    authenticated: false,
  });

  const [userContextData, setUserContextData] = useState<UserContextData>({
    user: getUserData(),
  });

  return (
    <AuthContext.Provider value={{ authContextData, setAuthContextData }}>
      <UserContext.Provider value={{ userContextData, setUserContextData }}>
        <Routes />
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
    </AuthContext.Provider>
  );
}

export default App;
