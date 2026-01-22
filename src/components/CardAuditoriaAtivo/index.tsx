import { AuditoriaAtivoType } from "@/types/auditoriaativo";
import "./styles.css";

interface Props {
  ativo: AuditoriaAtivoType;
}

const iconeAtivo: { [key: string]: string } = {
  ACESSORIO: "bi bi-easel",
  ELETRONICO: "bi bi-phone",
  EPI: "bi bi-person-walking",
  INFORMATICA: "bi bi-pc-display-horizontal",
  MOBILIARIO: "bi bi-building",
  SOFTWARE: "bi bi-terminal",
};

const CardAuditoriaAtivo = ({ ativo }: Props) => {
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
        <div className={`tag-status-auditoria ${ativo.status.toLowerCase()}`}>
          <span>{ativo.status}</span>
        </div>
        <button className="botao-redirecionar-auditoria" type="button">
          <i className="bi bi-card-checklist" />
        </button>
      </div>
    </div>
  );
};

export default CardAuditoriaAtivo;
