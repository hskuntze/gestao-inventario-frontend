import { TipoAtivoType } from "@/types/tipoativo";
import "./styles.css";
import { TipoNotificacao } from "@/types/tiponotificacao";
import { Link } from "react-router-dom";

interface Props {
  idAtivo: number;
  tipoAtivo: TipoAtivoType;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
}

const CardNotificacao = ({ idAtivo, mensagem, tipo, tipoAtivo, titulo }: Props) => {
  const iconeAtivo: Record<TipoNotificacao, string> = {
    ALERTA: "bi bi-exclamation-diamond",
    GARANTIA: "bi bi-calendar-event",
    EXPIRADO: "bi bi-calendar-x",
  };

  return (
    <Link to={`/gestao-inventario/ativo/formulario/${idAtivo}`} className="card-notificacao-container">
      <div className="card-icon">
        <i className={iconeAtivo[tipo]} />
      </div>
      <div className="card-info">
        <span className="card-title">{titulo}</span>
        <span className="card-message">{mensagem}</span>
      </div>
    </Link>
  );
};

export default CardNotificacao;
