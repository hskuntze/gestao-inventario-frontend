import { Route, Routes } from "react-router-dom";
import AdminCadastros from "./Cadastros";

const Admin = () => {
  return (
    <Routes>
      <Route path="/cadastros" element={<AdminCadastros />} />
    </Routes>
  );
};

export default Admin;
