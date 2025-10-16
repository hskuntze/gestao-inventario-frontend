import { CategoriaType } from "@/types/categoria";
import "./styles.css";
import { TipoAtivoType } from "@/types/tipoativo";

interface Props {
  idAtivo: number;
  tipoAtivo: TipoAtivoType;
  categoria: CategoriaType;
  mensagem: string;
}

const CardAtivoRecente = ({ idAtivo, mensagem, categoria, tipoAtivo }: Props) => {
  const iconeAtivo: { [key: string]: string } = {
    ACESSORIO: "bi bi-easel",
    ELETRONICO: "bi bi-phone",
    EPI: "bi bi-person-walking",
    INFORMATICA: "bi bi-pc-display-horizontal",
    MOBILIARIO: "bi bi-building",
    SOFTWARE: "bi bi-terminal",
  };

  return (
    <div className="card-ativo-recente-container">
      <div className="card-icon-white">
        <i className={iconeAtivo[categoria.nome]} />
      </div>
      <div className="card-info">
        <span className="card-title">{mensagem}</span>
      </div>
    </div>
  );
};

export default CardAtivoRecente;
