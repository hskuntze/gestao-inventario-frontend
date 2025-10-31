import './App.css';
import "bootstrap/dist/js/bootstrap.bundle";
import "react-toastify/ReactToastify.css";
import { useState } from 'react';
import { UserContext, UserContextData } from "@/utils/contexts/UserContext";
import { ToastContainer } from "react-toastify";
import { getUserData } from "@/utils/storage";
import Routes from "./Routes";
import { AuthProvider } from './utils/providers/AuthProvider';

function App() {
  const [userContextData, setUserContextData] = useState<UserContextData>({
    user: getUserData(),
  });

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
