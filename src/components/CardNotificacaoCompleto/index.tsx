import "./styles.css";
import { TipoNotificacao } from "@/types/tiponotificacao";
import { NotificacaoType } from "@/types/notificacao";
import { formatarData } from "@/utils/functions";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { useState } from "react";
import { toast } from "react-toastify";

interface Props {
  notificacao: NotificacaoType;
}

const CardNotificacaoCompleto = ({ notificacao }: Props) => {
  const [read, setRead] = useState<boolean>(notificacao.lida);
  const [animate, setAnimate] = useState<boolean>(false);

  const iconeAtivo: Record<TipoNotificacao, string> = {
    ALERTA: "bi bi-exclamation-diamond",
    GARANTIA: "bi bi-calendar-event",
    EXPIRADO: "bi bi-calendar-x",
    SOLICITACAO: "bi bi-bell",
  };

  const handleMakeAsRead = (notificacao: NotificacaoType) => {
    if (!read) {
      const requestParams: AxiosRequestConfig = {
        url: `/notificacoes/update/read/${notificacao.id}`,
        method: "POST",
        withCredentials: true,
      };

      requestBackend(requestParams)
        .then((res) => {
          setRead(true);
          setAnimate(true); // ativa a animação

          setTimeout(() => setAnimate(false), 400);
        })
        .catch((err) => {
          toast.error("Erro ao tentar marcar como lido.");
        });
    }
  };

  return (
    <div className={`card-completo-notificacao-container ${!read ? "notificacao-nao-lida" : "notificacao-lida"}`}>
      <div className="card-icon">
        <i className={iconeAtivo[notificacao.tipoNotificacao as TipoNotificacao]} />
      </div>
      <div className="card-info">
        <span className="card-title">{notificacao.titulo}</span>
        <span className="card-message">{notificacao.mensagem}</span>
        <span className="card-date">{formatarData(notificacao.dataCriacao)}</span>
      </div>
      <button type="button" className={`card-bell ${read ? "bell-readed" : ""}`} disabled={read} onClick={() => handleMakeAsRead(notificacao)}>
        {!read ? <i className={`bi bi-bell-fill ${animate ? "bell-pop" : ""}`} /> : <i className={`bi bi-bell ${animate ? "bell-pop" : ""}`} />}
      </button>
    </div>
  );
};

export default CardNotificacaoCompleto;
