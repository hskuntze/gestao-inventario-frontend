import "./styles.css";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { NotificacaoType } from "@/types/notificacao";
import { TipoNotificacao } from "@/types/tiponotificacao";

import { fetchAllNotificacoes } from "@/utils/functions";

import CNSkeletonLoader from "@/components/CardNotificacao/CNSkeletonLoader";
import CardNotificacaoCompleto from "@/components/CardNotificacaoCompleto";

const Notificacoes = () => {
  const [loadingNotificacoes, setLoadingNotificacoes] = useState(true);

  const [notificacoes, setNotificacoes] = useState<NotificacaoType[]>([]);

  useEffect(() => {
    async function getNotificacoes() {
      setLoadingNotificacoes(true);

      try {
        const data = await fetchAllNotificacoes();
        setNotificacoes(data);
        setLoadingNotificacoes(false);
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar notificações";
        toast.error(errorMsg);
      }
    }

    getNotificacoes();
  }, []);

  const counts: Record<TipoNotificacao, number> = {
    EXPIRADO: 0,
    ALERTA: 0,
    GARANTIA: 0,
  };

  notificacoes.forEach((n) => {
    const tipo = n.tipoNotificacao as TipoNotificacao;
    if (counts[tipo] !== undefined) counts[tipo]++;
  });

  return (
    <div className="notifications-container">
      <section className="dashboard-section">
        <div className="dashboard-element">
          <span className="section-title">Estatísticas de Notificações</span>
          <div className="dashboard-cards">
            <div className="card-estatistica-notificacao notificacao-garantia">
              <span>{counts.GARANTIA}</span>
              <span className="card-estatistica-info">Garantia</span>
            </div>
            <div className="card-estatistica-notificacao notificacao-alerta">
              <span>{counts.ALERTA}</span>
              <span className="card-estatistica-info">Alerta</span>
            </div>
            <div className="card-estatistica-notificacao notificacao-expirado">
              <span>{counts.EXPIRADO}</span>
              <span className="card-estatistica-info">Expirado</span>
            </div>
          </div>
        </div>
      </section>
      <section className="notificacoes-section">
        <div className="notificacoes-element">
          <span className="section-title">Notificações</span>
          {loadingNotificacoes ? (
            <CNSkeletonLoader />
          ) : notificacoes.length > 0 ? (
            notificacoes
              .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
              .map((n) => <CardNotificacaoCompleto notificacao={n} />)
          ) : (
            <div className="section-subtitle">
              <span>Sem notificações recentes...</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Notificacoes;
