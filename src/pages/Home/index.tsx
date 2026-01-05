import "./styles.css";
import { AxiosRequestConfig } from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { requestBackend } from "@/utils/requests";
import { usePhotoCapture } from "@/utils/hooks/usePhotoCapture";
import { useBarcodeScanner } from "@/utils/hooks/useBarcodeScanner";
import { getOS } from "@/utils/storage";
import { fetchAllAtivosRecentes, fetchAllNotificacoes } from "@/utils/functions";

import CardAtivoQtd from "@/components/CardAtivoQtd";
import CardNotificacao from "@/components/CardNotificacao";
import CardAtivoRecente from "@/components/CardAtivoRecente";
import CNSkeletonLoader from "@/components/CardNotificacao/CNSkeletonLoader";
import CAQSkeletonLoader from "@/components/CardAtivoQtd/CAQSkeletonLoader";
import CARSkeletonLoader from "@/components/CardAtivoRecente/CARSkeletonLoader";
import PhotoCaptureModal from "@/components/PhotoCaptureModal";

import { NotificacaoType } from "@/types/notificacao";
import { TipoNotificacao } from "@/types/tiponotificacao";
import { TipoAtivoType } from "@/types/tipoativo";
import { AtivoType } from "@/types/ativo";
import { QuantidadeAtivosType } from "@/types/qtdativos";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [loadingNotificacoes, setLoadingNotificacoes] = useState(false);
  const [loadingAtivosRecentes, setLoadingAtivosRecentes] = useState(false);
  const [os, setOs] = useState<string | null>(null);

  const [qtdAtivos, setQtdAtivos] = useState<QuantidadeAtivosType>();
  const [notificacoes, setNotificacoes] = useState<NotificacaoType[]>([]);
  const [recentes, setRecentes] = useState<AtivoType[]>([]);

  // Photo Capture Hook
  const { photoBase64, loading: photoLoading, capturePhoto, captureLocation, capturePhotoWithLocation, reset: resetPhoto } = usePhotoCapture();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);

  // Barcode scanner hook
  const { scanning, scan } = useBarcodeScanner();
  const navigate = useNavigate();

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
    let sistemaOperacional = getOS();

    if (os === null && sistemaOperacional !== undefined) {
      setOs(sistemaOperacional);
    }
  }, [os]);

  /**
   * Inicia fluxo de captura: tirar foto
   */
  const handleCapturePhoto = async () => {
    console.log("[Home] Iniciando captura de foto");
    const base64 = await capturePhoto();
    if (base64) {
      setIsModalOpen(true);
      setShowPhotoPreview(true);
    }
  };

  /**
   * Usuário confirma foto: capturar localização e logar resultado
   */
  const handleConfirmPhoto = async () => {
    console.log("[Home] Confirmando foto e capturando localização");
    const result = await capturePhotoWithLocation();
    if (result) {
      toast.success("✓ Foto e localização capturadas com sucesso!");
      console.log("[Home] Resultado completo:", result);

      // Resetar e fechar modal
      setIsModalOpen(false);
      setShowPhotoPreview(false);
      resetPhoto();
    }
  };

  /**
   * Usuário clica em "Tirar Outra"
   */
  const handleRetakeLogo = async () => {
    console.log("[Home] Retomando captura de foto");
    resetPhoto();
    setShowPhotoPreview(false);
    setIsModalOpen(false);
    // Aguardar um pouco e reabrir
    setTimeout(handleCapturePhoto, 300);
  };

  /**
   * Usuário cancela
   */
  const handleCancelPhoto = () => {
    console.log("[Home] Cancelando captura de foto");
    setIsModalOpen(false);
    setShowPhotoPreview(false);
    resetPhoto();
  };

  return (
    <div className="home-container">
      <section className="home-section">
        {os !== "Android" && os !== "iOS" && (
          <>
            <Link to={"/gestao-inventario/ativo/formulario/create"}>
              <button type="button" className="button submit-button auto-width pd-2">
                Adicionar Ativo
              </button>
            </Link>
            <Link to={"/gestao-inventario/relatorios"}>
              <button type="button" className="button general-button auto-width pd-2">
                Gerar Relatório
              </button>
            </Link>
          </>
        )}
        {(os === "Android" || os === "iOS") && (
          <>
            <button type="button" className="button general-button auto-width pd-2" onClick={handleCapturePhoto} disabled={photoLoading}>
              {photoLoading ? "Capturando..." : "📸 Capturar Foto"}
            </button>

            <button
              type="button"
              className="button general-button auto-width pd-2"
              onClick={async () => {
                console.log("[Home] Iniciando scanner de QR Code");
                const text = await scan();
                console.log("[Home] Resultado do scanner:", text);

                if (!text) {
                  toast.error("Nenhum QR Code lido ou operação cancelada.");
                  return;
                }

                // Esperamos formato inventario://patrimonio/<codigo>
                try {
                  const m = text.match(/^inventario:\/\/patrimonio\/(.+)$/i);
                  if (m && m[1]) {
                    const codigo = m[1];
                    toast.info(`QR Code lido: ${codigo}`);
                    console.log(`[Home] Navegando para cadastro do patrimônio: ${codigo}`);
                    navigate(`/gestao-inventario/ativo/formulario/${codigo}`);
                  } else {
                    toast.error("QR Code lido não está no formato esperado (inventario://patrimonio/<codigo>)");
                    console.warn("[Home] QR Code não corresponde ao esquema esperado:", text);
                  }
                } catch (err) {
                  console.error("[Home] Erro ao processar QR Code:", err);
                  toast.error("Erro ao processar QR Code");
                }
              }}
              disabled={scanning}
            >
              {scanning ? "Aguarde..." : "🔍 Ler QRCode"}
            </button>
          </>
        )}
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
            recentes
              .sort((a, b) => b.id - a.id)
              .slice(0, 3)
              .map((r) => <CardAtivoRecente ativo={r} />)
          ) : (
            <div className="section-subtitle">
              <span>Sem ativos recentes...</span>
            </div>
          )}
        </div>
      </section>

      {/* Modal de Preview de Foto */}
      <PhotoCaptureModal
        isOpen={isModalOpen}
        photoBase64={photoBase64}
        onConfirm={handleConfirmPhoto}
        onRetake={handleRetakeLogo}
        onCancel={handleCancelPhoto}
        loading={photoLoading}
      />
    </div>
  );
};

export default Home;
