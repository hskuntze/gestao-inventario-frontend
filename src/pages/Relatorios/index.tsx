import { Route, Routes } from "react-router-dom";
import RelatoriosLanding from "./Landing";
import RelatorioMovimentacao from "./Movimentacao";

const Relatorios = () => {
  return (
    <Routes>
      <Route path="/" element={<RelatoriosLanding />} />
      <Route path="/movimentacao" element={<RelatorioMovimentacao />} />
    </Routes>
  );
};

export default Relatorios;
