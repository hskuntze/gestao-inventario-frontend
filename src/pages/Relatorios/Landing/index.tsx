import "./styles.css";
import RelatorioMovimentacao from "../Movimentacao";
import { useState } from "react";

const RELATORIOS = [
  {
    key: "movimentacao",
    titulo: "Por Movimentação",
    descricao: "Relatório de movimentação de ativos com diferentes filtros",
    componente: <RelatorioMovimentacao />,
  },
  // {
  //   key: "patrimonio",
  //   titulo: "Por Patrimônio",
  //   descricao: "Relatório consolidado por patrimônio",
  //   componente: <RelatorioPatrimonio />
  // }
] as const;

type TipoRelatorio = "movimentacao" | "patrimonio" | "usuarios";

const RelatoriosLanding = () => {
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<TipoRelatorio>("movimentacao");
  return (
    <div className="page">
      <div className="page-header">
        <div className="header-content">
          <h2 className="page-title">Relatórios</h2>
        </div>
        <span className="page-subtitle">Gere diferentes tipos de relatório para auditoria</span>
      </div>
      <div className="page-relatorio">
        <div className="page-menu-lateral">
          <div className="list-content-container pd-0">
            {RELATORIOS.map((rel) => (
              <div
                key={rel.key}
                className={`tipo-relatorio-card ${relatorioSelecionado === rel.key ? "active" : ""}`}
                onClick={() => setRelatorioSelecionado(rel.key)}
              >
                <h4>{rel.titulo}</h4>
                <span>{rel.descricao}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="page-relatorio-conteudo">{RELATORIOS.find((r) => r.key === relatorioSelecionado)?.componente}</div>
      </div>
    </div>
  );
};

export default RelatoriosLanding;
