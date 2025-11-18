import "./styles.css";
import { HistoricoType } from "@/types/historico";
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
    DESCARTAR: "bi bi-trash3 descartar-icon",
    DEVOLVER: "bi bi-sign-turn-left devolver-icon",
    "ARQUIVO INSERIDO": "bi bi-file-earmark-arrow-up arquivo-inserido-icon",
  };

  const labels: { [key: string]: string } = {
    REGISTRO: "Ativo registrado",
    ATUALIZAÇÃO: "Ativo atualizado",
    ATRIBUIÇÃO: `Atribuído a ${element.usuarioResponsavel}`,
    MOVIMENTAÇÃO: `Ativo movimentado`,
    DESABILITAR: "Ativo desabilitado",
    HABILITAR: "Ativo habilitado",
    DESCARTAR: "Ativo descartado",
    DEVOLVER: "Ativo devolvido",
    "ARQUIVO INSERIDO": "Arquivo(s) inserido(s)",
  };

  return (
    <div className="historico-container">
      <div className="historico-icon">
        <i className={icons[element.operacao]} />
      </div>
      <div className="historico-content">
        <span className="historico-content-title">{labels[element.operacao]}</span>
        <span className="historico-content-info">{formatarData(element.createdAt)}</span>
        {element.operacao === "REGISTRO" && (
          <>
            <span className="historico-content-info">Setor: {element.area ?? "Sem setor"}</span>
            <span className="historico-content-info">Localização: {element.localizacao ?? "Sem localização"}</span>
          </>
        )}
        {element.operacao === "MOVIMENTAÇÃO" && (
          <>
            <span className="historico-content-info">Usuário Responsável: {element.usuarioResponsavel}</span>
            <span className="historico-content-info">Setor: {element.area}</span>
            <span className="historico-content-info">Localização: {element.localizacao}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default CardHistoricoAtivo;
