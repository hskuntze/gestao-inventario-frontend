import "./styles.css";
import { AtivoType } from "@/types/ativo";
import { Link } from "react-router-dom";

interface Props {
  ativo: AtivoType;
}

const CardAtivoRecente = ({ ativo }: Props) => {
  const iconeAtivo: { [key: string]: string } = {
    ACESSORIO: "bi bi-easel",
    ELETRONICO: "bi bi-phone",
    EPI: "bi bi-person-walking",
    INFORMATICA: "bi bi-pc-display-horizontal",
    MOBILIARIO: "bi bi-building",
    SOFTWARE: "bi bi-terminal",
  };

  return (
    <Link to={`/gestao-inventario/ativo/formulario/${ativo.id}`} className="card-ativo-recente-container">
      <div className="card-icon-white">
        <i className={iconeAtivo[ativo.categoria]} />
      </div>
      <div className="card-info">
        <span className="card-title">{ativo.descricao}</span>
        <span>Patrimônio: {ativo.idPatrimonial}</span>
      </div>
    </Link>
  );
};

export default CardAtivoRecente;
