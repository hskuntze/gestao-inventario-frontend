import { HistoricoType } from "@/types/historico";
import "./styles.css";
import { AtivoType } from "@/types/ativo";
import { formatarData } from "@/utils/functions";

interface Props {
  element: HistoricoType;
  ativo: AtivoType;
}

const CardHistoricoAtivo = ({ element, ativo }: Props) => {
  const icons: { [key: string]: string } = {
    REGISTRO: "bi bi-file-earmark-check registro-icon",
    ATUALIZAÇÃO: "bi bi-file-earmark-diff atualizacao-icon",
    ATRIBUIÇÃO: "bi bi-person atribuicao-icon",
  };

  const labels: { [key: string]: string } = {
    REGISTRO: "Ativo registrado",
    ATUALIZAÇÃO: "Ativo atualizado",
    ATRIBUIÇÃO: `Atribuído a ${ativo.usuarioResponsavel}`,
  };

  return (
    <div className="historico-container">
      <div className="historico-icon">
        <i className={icons[element.operation]} />
      </div>
      <div className="historico-content">
        <span className="historico-content-title">{labels[element.operation]}</span>
        <span className="historico-content-info">{formatarData(element.createdAt)}</span>
        {element.operation === "REGISTRO" && <span className="historico-content-info">Responsável: {ativo.responsavel}</span>}
      </div>
    </div>
  );
};

export default CardHistoricoAtivo;
