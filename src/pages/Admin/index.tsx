import { Route, Routes } from "react-router-dom";
import AdminCadastros from "./Cadastros";
import Notificacoes from "./Notificacoes";

const Admin = () => {
  return (
    <Routes>
      <Route path="/cadastros" element={<AdminCadastros />} />
      <Route path="/notificacoes" element={<Notificacoes />} />
    </Routes>
  );
};

export default Admin;
