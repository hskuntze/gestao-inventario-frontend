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
    "ARQUIVO EXCLUÍDO": "bi bi-file-earmark-minus arquivo-excluido-icon",
    "EM MANUTENÇÃO": "bi bi bi-wrench-adjustable-circle em-manutencao-icon",
    "RETIRADO MANUTENÇÃO": "bi bi-wrench-adjustable-circle-fill retirado-manutencao-icon",
    "SOLICITAÇÃO CRIADA": "bi bi-file-plus-fill solicitacao-criada-icon",
    "SOLICITAÇÃO APROVADA": "bi bi-file-check-fill solicitacao-aprovada-icon",
    "SOLICITAÇÃO RECUSADA": "bi bi-file-x-fill solicitacao-recusada-icon",
    "SOLICITAÇÃO CANCELADA": "bi bi-folder-fill solicitacao-cancelada-icon",
    "SOLICITAÇÃO FINALIZADA": "bi bi-file-check-fill solicitacao-finalizada-icon",
    "SOLICITAÇÃO DESISTÊNCIA": "bi bi-file-check-fill solicitacao-desistencia-icon",
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
    "ARQUIVO EXCLUÍDO": "Arquivo excluído",
    "EM MANUTENÇÃO": "Ativo em manutenção",
    "RETIRADO MANUTENÇÃO": "Ativo retirado da manutenção",
    "SOLICITAÇÃO CRIADA": "Solicitação criada",
    "SOLICITAÇÃO APROVADA": "Solicitação aprovada",
    "SOLICITAÇÃO RECUSADA": "Solicitação recusada",
    "SOLICITAÇÃO CANCELADA": "Solicitação cancelada",
    "SOLICITAÇÃO FINALIZADA": "Solicitação finalizada",
    "SOLICITAÇÃO DESISTÊNCIA": "Desistência da solicitação",
  };

  return (
    <div className="historico-container">
      <div className="historico-icon">
        <i className={icons[element.operacao]} />
      </div>
      <div className="historico-content">
        <span className="historico-content-title">{labels[element.operacao]}</span>
        <span className="historico-content-info">{formatarData(element.createdAt)}</span>
        {(element.operacao === "REGISTRO" || element.operacao === "DEVOLVER") && (
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
        {element.operacao === "ARQUIVO EXCLUÍDO" && <span className="historico-content-info">Realizado por: {element.userNome}</span>}
        {(element.operacao === "EM MANUTENÇÃO" || element.operacao === "RETIRADO MANUTENÇÃO") && (
          <span className="historico-content-info">Realizado por: {element.userNome}</span>
        )}
      </div>
    </div>
  );
};

export default CardHistoricoAtivo;
