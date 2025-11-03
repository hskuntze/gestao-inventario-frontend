import { HistoricoType } from "@/types/historico";
import "./styles.css";
import { formatarData } from "@/utils/functions";

interface Props {
  element: HistoricoType;
}

const CardHistoricoAtivo = ({ element }: Props) => {
  const icons: { [key: string]: string } = {
    REGISTRO: "bi bi-file-earmark-check registro-icon",
    ATUALIZAÇÃO: "bi bi-file-earmark-diff atualizacao-icon",
    ATRIBUIÇÃO: "bi bi-person atribuicao-icon",
    MOVIMENTAÇÃO: "bi bi-arrows-move movimentacao-icon",
    DESABILITAR: "bi bi-x-circle desabilitar-icon",
    HABILITAR: "bi bi-check-circle habilitar-icon",
  };

  const labels: { [key: string]: string } = {
    REGISTRO: "Ativo registrado",
    ATUALIZAÇÃO: "Ativo atualizado",
    ATRIBUIÇÃO: `Atribuído a ${element.usuarioResponsavel}`,
    MOVIMENTAÇÃO: `Movido para ${element.usuarioResponsavel}`,
    DESABILITAR: "Ativo desabilitado",
    HABILITAR: "Ativo habilitado",
  };

  return (
    <div className="historico-container">
      <div className="historico-icon">
        <i className={icons[element.operation]} />
      </div>
      <div className="historico-content">
        <span className="historico-content-title">{labels[element.operation]}</span>
        <span className="historico-content-info">{formatarData(element.createdAt)}</span>
        {element.operation === "REGISTRO" && <span className="historico-content-info">Área: {element.area}</span>}
        {element.operation === "REGISTRO" && <span className="historico-content-info">Localização: {element.localizacao}</span>}
        {element.operation === "MOVIMENTAÇÃO" && <span className="historico-content-info">Área: {element.area}</span>}
        {element.operation === "MOVIMENTAÇÃO" && <span className="historico-content-info">Localização: {element.localizacao}</span>}
      </div>
    </div>
  );
};

export default CardHistoricoAtivo;
