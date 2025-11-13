import { Link } from "react-router-dom";
import "./styles.css";

const NaoEncontrado = () => {
  return (
    <div className="home-container">
      <div className="nao-encontrado-container">
        <span className="nao-encontrado">Não foi possível encontrar este elemento ou esta página.</span>
        <div>
          <Link to={"/gestao-inventario"} className="button submit-button auto-width pd-2">
            Ir para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NaoEncontrado;
