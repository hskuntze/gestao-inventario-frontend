import { Navigate, Route, Routes } from "react-router-dom";
import SolicitacoesList from "./List";
import SolicitacoesForm from "./Form";

const SolicitacoesPage = () => {
  return (
    <Routes>
      <Route path="/" element={<SolicitacoesList />} />
      <Route path="/formulario/:id" element={<SolicitacoesForm />} />
      <Route path="/formulario" element={<Navigate to="/gestao-inventario/solicitacao" replace />} />
    </Routes>
  );
};

export default SolicitacoesPage;
