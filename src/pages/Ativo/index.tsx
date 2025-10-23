import { Route, Routes } from "react-router-dom";
import AtivoForm from "./Form";
import AtivoList from "./List";

const Ativo = () => {
  return (
    <Routes>
      <Route path="/" element={<AtivoList />} />
      <Route path="/formulario/:id" element={<AtivoForm />} />
    </Routes>
  );
};

export default Ativo;
