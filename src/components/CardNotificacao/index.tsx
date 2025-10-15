import "./styles.css";

interface Props {
  idAtivo: number;
  tipoAtivo: "TANGIVEL" | "INTANGIVEL" | "TANGIVEL_MANUTENCAO";
  titulo: string;
  mensagem: string;
  tipo: "MANUTENCAO" | "GARANTIA" | "OUTRO";
}

const CardNotificacao = ({ idAtivo, mensagem, tipo, tipoAtivo, titulo }: Props) => {
  const iconeAtivo: { [key: string]: string } = {
    MANUTENCAO: "bi bi-wrench-adjustable",
    GARANTIA: "bi bi-calendar2-x",
    OUTRO: "bi bi-blockquote-right",
  };

  return (
    <div className="card-notificacao-container">
      <div className="card-icon">
        <i className={iconeAtivo[tipo]} />
      </div>
      <div className="card-info">
        <span className="card-title">{titulo}</span>
        <span className="card-message">{mensagem}</span>
      </div>
    </div>
  );
};

export default CardNotificacao;
