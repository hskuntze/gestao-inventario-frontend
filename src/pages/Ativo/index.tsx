import { Navigate, Route, Routes } from "react-router-dom";
import AtivoForm from "./Form";
import AtivoList from "./List";

const Ativo = () => {
  return (
    <Routes>
      <Route path="/" element={<AtivoList />} />
      <Route path="/formulario/:id" element={<AtivoForm />} />
      <Route path="/formulario" element={<Navigate to="/gestao-inventario/ativo" replace />} />
    </Routes>
  );
};

export default Ativo;
