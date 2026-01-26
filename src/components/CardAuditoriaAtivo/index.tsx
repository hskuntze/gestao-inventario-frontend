import { AuditoriaAtivoType } from "@/types/auditoriaativo";
import "./styles.css";
import { Link } from "react-router-dom";

interface Props {
  ativo: AuditoriaAtivoType;
  idAuditoria: number;
}

const iconeAtivo: { [key: string]: string } = {
  ACESSORIO: "bi bi-easel",
  ELETRONICO: "bi bi-phone",
  EPI: "bi bi-person-walking",
  INFORMATICA: "bi bi-pc-display-horizontal",
  MOBILIARIO: "bi bi-building",
  SOFTWARE: "bi bi-terminal",
};

const tratarStatus: { [key: string]: string } = {
  NAO_LOCALIZADO: "NÃO LOCALIZADO",
  SOB_MANUTENCAO: "EM MANUTENÇÃO",
  CONFERIDO: "CONFERIDO",
  PENDENTE: "PENDENTE",
  DIVERGENTE: "DIVERGENTE",
};

const CardAuditoriaAtivo = ({ ativo, idAuditoria }: Props) => {
  return (
    <div className="card-auditoria-ativo-container">
      <div className="caa-esquerdo">
        <div className="caa-icone">
          <i className={`${iconeAtivo[ativo.categoriaAtivo]}`}></i>
        </div>
        <div className="caa-info">
          <span className="caa-titulo">{ativo.nomeAtivo}</span>
          <div className="caa-subtitulo">
            <span>
              Patrimônio: <span className="caa-info-destaque">{ativo.idPatrimonioAtivo}</span>
            </span>
            <div className="grey-dot"></div>
            <span>
              Local: <span className="caa-info-destaque">{ativo.localizacaoAtivo}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="caa-direito">
        <div
          className={`tag-status-auditoria ${ativo.status.replace("_", "-").toLowerCase()}`}
          title={ativo.status === "SOB_MANUTENCAO" ? "Retire o ativo da manutenção" : ""}
        >
          <span>{tratarStatus[ativo.status]}</span>
        </div>
        <Link
          className={`botao-redirecionar-auditoria ${ativo.status !== "PENDENTE" ? "disabled-field" : ""}`}
          type="button"
          to={ativo.status === "PENDENTE" ? `/gestao-inventario/auditoria/ativo/${ativo.id}?auditoriaId=${idAuditoria}` : "#"}
        >
          <i className="bi bi-card-checklist" />
        </Link>
      </div>
    </div>
  );
};

export default CardAuditoriaAtivo;
