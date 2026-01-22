import { Route, Routes } from "react-router-dom";
import AuditoriaList from "./List";

const Auditoria = () => {
  return (
    <Routes>
      <Route path="/" element={<AuditoriaList />} />
    </Routes>
  );
};

export default Auditoria;
