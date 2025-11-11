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
import { fetchAllAtivosRecentes, fetchAllNotificacoes, tiposAtivo } from "@/utils/functions";
import { TipoNotificacao } from "@/types/tiponotificacao";
import { TipoAtivoType } from "@/types/tipoativo";
import { AtivoType } from "@/types/ativo";
import { CategoriaType } from "@/types/categoria";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [loadingNotificacoes, setLoadingNotificacoes] = useState(false);
  const [loadingAtivosRecentes, setLoadingAtivosRecentes] = useState(false);

  const [qtdAtivos, setQtdAtivos] = useState<QuantidadeAtivosType>();
  const [notificacoes, setNotificacoes] = useState<NotificacaoType[]>([]);
  const [recentes, setRecentes] = useState<AtivoType[]>([]);

  const [os, setOs] = useState<string>();

  function getOS() {
    const userAgent = window.navigator.userAgent.toLowerCase();

    if (userAgent.includes("windows")) return "Windows";
    if (userAgent.includes("mac")) return "macOS";
    if (userAgent.includes("linux")) return "Linux";
    if (userAgent.includes("android")) return "Android";
    if (userAgent.includes("iphone") || userAgent.includes("ipad")) return "iOS";

    return "Desconhecido";
  }

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

  useEffect(() => {
    async function getAtivosRecentes() {
      setLoadingAtivosRecentes(true);

      try {
        const data = await fetchAllAtivosRecentes();
        setRecentes(data);
        setLoadingAtivosRecentes(false);
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar ativos recentes";
        toast.error(errorMsg);
      }
    }

    getAtivosRecentes();
  }, []);

  useEffect(() => {
    if(os === undefined) {
      setOs(getOS());
    }
  }, [os]);

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
          Ler QRCode
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
          ) : recentes.length > 0 ? (
            recentes.map((r) => (
              <CardAtivoRecente
                idAtivo={r.id}
                mensagem={r.descricao}
                tipoAtivo={tiposAtivo[r.tipoAtivo] as TipoAtivoType}
                categoria={r.categoria as CategoriaType}
              />
            ))
          ) : (
            <div className="section-subtitle">
              <span>Sem ativos recentes...</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
