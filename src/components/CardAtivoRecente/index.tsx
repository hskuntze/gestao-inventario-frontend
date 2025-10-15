import "./styles.css";

interface Props {
  idAtivo: number;
  tipoAtivo: "TANGIVEL" | "INTANGIVEL" | "TANGIVEL_MANUTENCAO";
  categoria: "ACESSORIO" | "ELETRONICO" | "EPI" | "INFORMATICA" | "MOBILIARIO" | "SOFTWARE";
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
        <i className={iconeAtivo[categoria]} />
      </div>
      <div className="card-info">
        <span className="card-title">{mensagem}</span>
      </div>
    </div>
  );
};

export default CardAtivoRecente;
