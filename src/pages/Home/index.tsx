import "./styles.css";
import { AxiosRequestConfig } from "axios";
import { useEffect, useState } from "react";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import { QuantidadeAtivosType } from "@/types/qtdativos";
import CardAtivoQtd from "@/components/CardAtivoQtd";
import CardNotificacao from "@/components/CardNotificacao";
import CardAtivoRecente from "@/components/CardAtivoRecente";
import CNSkeletonLoader from "@/components/CardNotificacao/CNSkeletonLoader";
import CAQSkeletonLoader from "@/components/CardAtivoQtd/CAQSkeletonLoader";
import CARSkeletonLoader from "@/components/CardAtivoRecente/CARSkeletonLoader";
import { Link } from "react-router-dom";
import { NotificacaoType } from "@/types/notificacao";
import { fetchAllNotificacoes } from "@/utils/functions";
import { TipoNotificacao } from "@/types/tiponotificacao";
import { TipoAtivoType } from "@/types/tipoativo";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [loadingNotificacoes, setLoadingNotificacoes] = useState(false);
  const [loadingAtivosRecentes, setLoadingAtivosRecentes] = useState(false);

  const [qtdAtivos, setQtdAtivos] = useState<QuantidadeAtivosType>();
  const [notificacoes, setNotificacoes] = useState<NotificacaoType[]>([]);

  function getOS() {
    const userAgent = window.navigator.userAgent.toLowerCase();

    if (userAgent.includes("windows")) return "Windows";
    if (userAgent.includes("mac")) return "macOS";
    if (userAgent.includes("linux")) return "Linux";
    if (userAgent.includes("android")) return "Android";
    if (userAgent.includes("iphone") || userAgent.includes("ipad")) return "iOS";

    return "Desconhecido";
  }

  console.log(getOS());

  useEffect(() => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/ativos/qtd/total",
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        setQtdAtivos(res.data as QuantidadeAtivosType);
      })
      .catch((err) => {
        toast.error("Erro ao tentar carregar informações de quantidade de ativos.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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

  return (
    <div className="home-container">
      <section className="home-section">
        <Link to={"/gestao-inventario/ativo/formulario/create"}>
          <button type="button" className="button submit-button auto-width pd-2">
            Adicionar Ativo
          </button>
        </Link>
        <button type="button" className="button general-button auto-width pd-2">
          Gerar Relatório
        </button>
        <button type="button" className="button general-button auto-width pd-2">
          Iniciar Processo
        </button>
      </section>
      <section className="home-section cards-section">
        {!loading ? (
          qtdAtivos ? (
            <>
              <CardAtivoQtd qtd={qtdAtivos.qtdTangivel} tipo="TANGIVEL" total={qtdAtivos.total} />
              <CardAtivoQtd qtd={qtdAtivos.qtdIntangivel} tipo="INTANGIVEL" total={qtdAtivos.total} />
              <CardAtivoQtd qtd={qtdAtivos.qtdTangivelLocacao} tipo="TANGIVEL_LOCACAO" total={qtdAtivos.total} />
            </>
          ) : (
            <span>No data</span>
          )
        ) : (
          <CAQSkeletonLoader />
        )}
      </section>
      <section className="home-section info-section">
        <div className="notificacoes-container">
          <span className="section-title">Notificações</span>
          {loadingNotificacoes ? (
            <CNSkeletonLoader />
          ) : notificacoes.length > 0 ? (
            notificacoes
              .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
              .slice(0, 3)
              .map((n) => (
                <CardNotificacao
                  idAtivo={n.idAtivo}
                  titulo={n.titulo}
                  mensagem={n.mensagem}
                  tipo={n.tipoNotificacao as TipoNotificacao}
                  tipoAtivo={n.tipoAtivo as TipoAtivoType}
                  key={n.idAtivo}
                />
              ))
          ) : (
            <div className="section-subtitle">
              <span>Sem notificações recentes...</span>
            </div>
          )}
        </div>
        <div className="ativos-recentes-container">
          <span className="section-title">Ativos Recentes</span>
          {loadingAtivosRecentes ? (
            <CARSkeletonLoader />
          ) : (
            <>
              <CardAtivoRecente idAtivo={0} mensagem="Notebook Dell XPS 15" tipoAtivo={"TANGIVEL"} categoria={{ nome: "ELETRONICO" }} />
              <CardAtivoRecente idAtivo={0} mensagem="Cadeira de escritório" tipoAtivo={"TANGIVEL"} categoria={{ nome: "MOBILIARIO" }} />
              <CardAtivoRecente
                idAtivo={0}
                mensagem="Pedestal para TV de 32” a 75” Suporte vídeoconferência com rodízios"
                tipoAtivo={"TANGIVEL"}
                categoria={{ nome: "ACESSORIO" }}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
