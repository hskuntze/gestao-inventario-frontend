import { Link } from "react-router-dom";
import "./styles.css";

const RelatoriosLanding = () => {
  return (
    <div className="page">
      <div className="page-header">
        <div className="header-content">
          <h2 className="page-title">Relatórios</h2>
        </div>
        <span className="page-subtitle">Gere diferentes tipos de relatório para auditoria</span>
      </div>
      <div className="page-body w-100">
        <div className="list-content-container pd-0">
          <Link to={"/gestao-inventario/relatorios/movimentacao"} className="tipo-relatorio-card">
            <h4>Por Movimentação</h4>
            <span>Relatório de movimentação de ativos com diferentes filtros</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosLanding;
