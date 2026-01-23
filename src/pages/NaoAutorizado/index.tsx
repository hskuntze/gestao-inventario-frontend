import { Link } from "react-router-dom";
import "./styles.css";
import Denied from "@/components/Denied";

const NaoAutorizado = () => {
  return (
    <div className="home-container">
      <div className="nao-encontrado-container">
        <div>
          <Link to={"/gestao-inventario"} className="button submit-button auto-width pd-2">
            Ir para a página inicial
          </Link>
        </div>
        <Denied />
      </div>
    </div>
  );
};

export default NaoAutorizado;
