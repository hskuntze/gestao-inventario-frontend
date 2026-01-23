import { Route, Routes } from "react-router-dom";
import AuditoriaList from "./List";
import AuditoriaForm from "./Form";

const Auditoria = () => {
  return (
    <Routes>
      <Route path="/" element={<AuditoriaList />} />
      <Route path="/ativo/:id" element={<AuditoriaForm />} />
    </Routes>
  );
};

export default Auditoria;
