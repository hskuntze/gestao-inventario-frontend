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

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [loadingNotificacoes, setLoadingNotificacoes] = useState(false);
  const [loadingAtivosRecentes, setLoadingAtivosRecentes] = useState(false);

  const [qtdAtivos, setQtdAtivos] = useState<QuantidadeAtivosType>();

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
    //setLoading(true);

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
        //setLoading(false);
      });
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
          ) : (
            <>
              <CardNotificacao
                idAtivo={0}
                titulo="Manutenção necessária para o notebook Dell XPS 15"
                mensagem="Recomenda-se limpeza preventiva e verificação da pasta térmica"
                tipo="MANUTENCAO"
                tipoAtivo={{ tipo: "TANGIVEL" }}
                key={1}
              />
              <CardNotificacao
                idAtivo={0}
                titulo="Garantia do monitor LG expirando em 30 dias"
                mensagem="Modelo LG de SN XBC0-01-2251"
                tipo="GARANTIA"
                tipoAtivo={{ tipo: "TANGIVEL" }}
                key={2}
              />
            </>
          )}
        </div>
        <div className="ativos-recentes-container">
          <span className="section-title">Ativos Recentes</span>
          {loadingAtivosRecentes ? (
            <CARSkeletonLoader />
          ) : (
            <>
              <CardAtivoRecente idAtivo={0} mensagem="Notebook Dell XPS 15" tipoAtivo={{ tipo: "TANGIVEL" }} categoria={{ nome: "ELETRONICO" }} />
              <CardAtivoRecente idAtivo={0} mensagem="Cadeira de escritório" tipoAtivo={{ tipo: "TANGIVEL" }} categoria={{ nome: "MOBILIARIO" }} />
              <CardAtivoRecente
                idAtivo={0}
                mensagem="Pedestal para TV de 32” a 75” Suporte vídeoconferência com rodízios"
                tipoAtivo={{ tipo: "TANGIVEL" }}
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
