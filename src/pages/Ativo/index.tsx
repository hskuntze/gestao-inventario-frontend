import { Route, Routes } from "react-router-dom";
import AtivoForm from "./Form";

const Ativo = () => {
  return (
    <Routes>
      <Route path="/formulario/:id" element={<AtivoForm />} />
    </Routes>
  );
};

export default Ativo;
