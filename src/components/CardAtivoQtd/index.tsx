import { Link } from "react-router-dom";
import ProgressBar from "../ProgressBar";
import "./styles.css";

interface Props {
  tipo: "TANGIVEL" | "INTANGIVEL" | "TANGIVEL_LOCACAO";
  qtd: number;
  total: number;
}

const CardAtivoQtd = ({ qtd, tipo, total }: Props) => {
  const titulo: { [key: string]: string } = {
    TANGIVEL: "Tangíveis",
    INTANGIVEL: "Intangíveis",
    TANGIVEL_LOCACAO: "Locação",
  };

  return (
    <Link to="/gestao-inventario/ativo" className="card-container">
      <span className="card-title">{titulo[tipo]}</span>
      <span className="card-number">{qtd}</span>
      <ProgressBar total={total} value={qtd} key={"BARRA-PROGRESSO-CARD-" + tipo} />
    </Link>
  );
};

export default CardAtivoQtd;
