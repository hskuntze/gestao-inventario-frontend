import "./styles.css";
import { AxiosRequestConfig } from "axios";
import { useEffect, useState } from "react";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import { QuantidadeAtivosType } from "@/types/qtdativos";
import CardAtivoQtd from "@/components/CardAtivoQtd";
import CardNotificacao from "@/components/CardNotificacao";
import CardAtivoRecente from "@/components/CardAtivoRecente";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [qtdAtivos, setQtdAtivos] = useState<QuantidadeAtivosType>();

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

  return (
    <div className="home-container">
      <section className="home-section">
        <button type="button" className="button submit-button auto-width pd-2">
          Adicionar Ativo
        </button>
        <button type="button" className="button general-button auto-width pd-2">
          Gerar Relatório
        </button>
        <button type="button" className="button general-button auto-width pd-2">
          Iniciar Processo
        </button>
      </section>
      <section className="home-section cards-section">
        {qtdAtivos ? (
          <>
            <CardAtivoQtd qtd={qtdAtivos.qtdTangivel} tipo="TANGIVEL" total={qtdAtivos.total} />
            <CardAtivoQtd qtd={qtdAtivos.qtdIntangivel} tipo="INTANGIVEL" total={qtdAtivos.total} />
            <CardAtivoQtd qtd={qtdAtivos.qtdTangivelLocacao} tipo="TANGIVEL_LOCACAO" total={qtdAtivos.total} />
          </>
        ) : (
          <></>
        )}
      </section>
      <section className="home-section info-section">
        <div className="notificacoes-container">
          <span className="section-title">Notificações</span>
          <CardNotificacao
            idAtivo={0}
            titulo="Manutenção necessária para o notebook Dell XPS 15"
            mensagem="Recomenda-se limpeza preventiva e verificação da pasta térmica"
            tipo="MANUTENCAO"
            tipoAtivo="TANGIVEL"
            key={1}
          />
          <CardNotificacao
            idAtivo={0}
            titulo="Garantia do monitor LG expirando em 30 dias"
            mensagem="Modelo LG de SN XBC0-01-2251"
            tipo="GARANTIA"
            tipoAtivo="TANGIVEL"
            key={2}
          />
        </div>
        <div className="ativos-recentes-container">
          <span className="section-title">Ativos Recentes</span>
          <CardAtivoRecente idAtivo={0} mensagem="Notebook Dell XPS 15" tipoAtivo="TANGIVEL" categoria="ELETRONICO" />
          <CardAtivoRecente idAtivo={0} mensagem="Cadeira de escritório" tipoAtivo="TANGIVEL" categoria="MOBILIARIO" />
          <CardAtivoRecente
            idAtivo={0}
            mensagem="Pedestal para TV de 32” a 75” Suporte vídeoconferência com rodízios"
            tipoAtivo="TANGIVEL"
            categoria="ACESSORIO"
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
