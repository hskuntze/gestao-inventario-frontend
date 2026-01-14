import { Navigate, Route, Routes } from "react-router-dom";
import AtivoForm from "./Form";
import AtivoList from "./List";
import AtivoFormLote from "./FormLote";

const Ativo = () => {
  return (
    <Routes>
      <Route path="/" element={<AtivoList />} />
      <Route path="/formulario/:id" element={<AtivoForm />} />
      <Route path="/formulario" element={<Navigate to="/gestao-inventario/ativo" replace />} />
      <Route path="/formulario/lote/create" element={<AtivoFormLote />} />
    </Routes>
  );
};

export default Ativo;
