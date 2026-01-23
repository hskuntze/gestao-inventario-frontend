import "./styles.css";

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";
import { Controller, useForm } from "react-hook-form";

import { AuditoriaAtivoType } from "@/types/auditoriaativo";

import PhotoCaptureModal from "@/components/PhotoCaptureModal";
import Loader from "@/components/Loader";

import { requestBackend } from "@/utils/requests";
import { PhotoCaptureResult, usePhotoCapture } from "@/utils/hooks/usePhotoCapture";
import { getOS } from "@/utils/storage";

type UrlParams = {
  id: string;
};

type FormData = {
  status: string;
  observacao: string;
};

const iconeAtivo: { [key: string]: string } = {
  ACESSORIO: "bi bi-easel",
  ELETRONICO: "bi bi-phone",
  EPI: "bi bi-person-walking",
  INFORMATICA: "bi bi-pc-display-horizontal",
  MOBILIARIO: "bi bi-building",
  SOFTWARE: "bi bi-terminal",
};

const AuditoriaForm = () => {
  const urlParams = useParams<UrlParams>();

  const [ativo, setAtivo] = useState<AuditoriaAtivoType>();

  const [loading, setLoading] = useState<boolean>(false);
  const [os, setOs] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const auditoriaId = searchParams.get("auditoriaId");

  const navigate = useNavigate();

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
    control,
    reset,
    watch,
  } = useForm<FormData>();

  // Photo capture hook + modal state
  const { photoBase64, loading: photoLoading, capturePhoto, captureLocation, reset: resetPhoto } = usePhotoCapture();

  // Auxiliares para tirar foto (app)
  const [photoModalOpen, setPhotoModalOpen] = useState<boolean>(false);
  const [confirmedPhoto, setConfirmedPhoto] = useState<PhotoCaptureResult | null>(null);

  const onSubmit = (formData: FormData) => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: `/auditoria/conferir/${urlParams.id}`,
      method: "POST",
      withCredentials: true,
      params: {
        status: formData.status,
        observacao: formData.observacao,
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success("Conferência salva com sucesso.");
        navigate(`/gestao-inventario/auditoria?auditoriaId=${auditoriaId}`);
      })
      .catch((err) => {
        const errorMsg = (err as Error).message || "Erro desconhecido ao tentar salvar a auditoria";
        toast.error(errorMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleConfirmPhoto = async () => {
    // Close modal while fetching location
    setPhotoModalOpen(false);

    try {
      const loc = await captureLocation();

      const result: PhotoCaptureResult = {
        photoBase64: photoBase64 || "",
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        timestamp: new Date().toISOString(),
      };

      setConfirmedPhoto(result);
      console.log("[Ativo Form] Foto confirmada:", result);
    } catch (err) {
      console.error("Erro ao confirmar foto", err);
    } finally {
      // reset temporary hook state
      resetPhoto();
    }
  };

  const handleRetakePhoto = async () => {
    resetPhoto();
    await capturePhoto();
  };

  const handleCancelPhoto = () => {
    resetPhoto();
    setPhotoModalOpen(false);
  };

  const loadInfo = useCallback(() => {
    const requestParams: AxiosRequestConfig = {
      url: `/auditoria/ativo/${urlParams.id}`,
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        setAtivo(res.data as AuditoriaAtivoType);
      })
      .catch((err) => {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar localizações";
        toast.error(errorMsg);
      });
  }, [urlParams]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  // Função auxiliar que carrega o sistema operacional (app)
  useEffect(() => {
    let sistemaOperacional = getOS();

    if (os === null && sistemaOperacional !== undefined) {
      setOs(sistemaOperacional);
    }
  }, [os]);

  return (
    <div className="page page-auditoria">
      <div className="page-auditoria-content">
        <div className="header-content">
          <h2 className="page-title">Conferência de Ativo</h2>
        </div>
        <span className="page-subtitle">Valide as informações físicas e o status do patrimônio</span>
        <div className="card-detalhes-ativo-auditoria">
          <div className="cda-info">
            <span className="cda-info-title">Ativo selecionado</span>
            <div className="cda-info-ativo-title">
              <span>{ativo?.nomeAtivo}</span>
              <span className="cda-info-id-patrimonio">{ativo?.idPatrimonioAtivo}</span>
            </div>
            <div className="cda-info-footer">
              <div className="cda-if-detalhe">
                <span>Localização</span>
                <span>{ativo?.localizacaoAtivo}</span>
              </div>
              <div className="cda-if-detalhe">
                <span>Responsável</span>
                <span>{ativo?.usuarioResponsavelAtivo}</span>
              </div>
            </div>
          </div>
          <div className="cda-icone">
            <i className={`${ativo ? iconeAtivo[ativo?.categoriaAtivo] : ""}`}></i>
          </div>
        </div>

        {/* ------- CONTAINER QR-CODE ------- */}
        <div className="qr-code-reader-container">
          {/* MODAL PARA CAPTURA DE FOTO E PREVIEW (preview nativo da câmera gerenciado pelo Capacitor) */}
          <PhotoCaptureModal
            isOpen={photoModalOpen}
            photoBase64={photoBase64}
            onConfirm={handleConfirmPhoto}
            onRetake={handleRetakePhoto}
            onCancel={handleCancelPhoto}
            loading={photoLoading}
          />

          {/* Inline preview of confirmed photo */}
          {confirmedPhoto && (
            <div className="inline-photo-preview" style={{ marginTop: 12 }}>
              <span className="form-title">Foto Capturada</span>
              <div style={{ marginTop: 8 }}>
                <img src={`data:image/jpeg;base64,${confirmedPhoto.photoBase64}`} alt="Foto do ativo" style={{ maxWidth: "100%", borderRadius: 6 }} />
                <div style={{ marginTop: 8, color: "#444" }}>
                  <div>Latitude: {confirmedPhoto.latitude ?? "—"}</div>
                  <div>Longitude: {confirmedPhoto.longitude ?? "—"}</div>
                  <div>Timestamp: {confirmedPhoto.timestamp}</div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* ------- FIN CONTAINER QR-CODE ------- */}

        <div className="auditar-form">
          <form className="form-auditoria-ativo" onSubmit={handleSubmit(onSubmit)}>
            <div className="div-input-formulario">
              <div>
                <span>Status da Conferência</span>
                <span className="obrigatorio-ast">*</span>
              </div>
              <Controller
                name="status"
                control={control}
                rules={{
                  required: "Campo obrigatório",
                }}
                render={({ field }) => (
                  <select
                    id="area"
                    className={`input-formulario ${errors.status ? "input-error" : ""}`}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const selectedStatus = e.target.value;

                      if (selectedStatus !== "") {
                        setSelectedStatus(selectedStatus);
                      } else {
                        setSelectedStatus(null);
                      }
                      field.onChange(selectedStatus || null);
                    }}
                  >
                    <option value="">Selecione um status de conferência</option>
                    <option value="CONFERIDO">Conferido</option>
                    <option value="NAO_LOCALIZADO">Não Localizado</option>
                    <option value="DIVERGENTE">Divergente</option>
                    <option value="SOB_MANUTENCAO">Sob Manutenção</option>
                  </select>
                )}
              />
              <div className="invalid-feedback d-block div-erro">{errors.status?.message}</div>
            </div>
            <div className="div-input-formulario">
              <div>
                <span>Observações</span>
                {selectedStatus !== "CONFERIDO" ? <span className="obrigatorio-ast">*</span> : <></>}
              </div>
              <textarea
                id="observacao-auditoria"
                className={`input-formulario input-textarea-formulario ${errors.observacao ? "input-error" : ""}`}
                {...register("observacao", { required: selectedStatus !== "CONFERIDO" ? "Campo obrigatório" : false })}
                maxLength={255}
                rows={7}
                style={{ paddingTop: "10px" }}
                placeholder="Ex.: etiqueta danificada, trocou de usuário, não foi localizado..."
              />
              <div className="invalid-feedback d-block div-erro">{errors.observacao?.message}</div>
            </div>
            <div className="auditoria-form-buttons">
              {loading ? (
                <div className="loader-div">
                  <Loader />
                </div>
              ) : (
                <button type="submit" className="salvar-conferencia">
                  <i className="bi bi-floppy-fill" />
                  Salvar Conferência
                </button>
              )}
              <button
                type="button"
                className="cancelar-conferencia"
                onClick={(e) => {
                  e.preventDefault();

                  navigate(`/gestao-inventario/auditoria?auditoriaId=${auditoriaId}`);
                }}
              >
                Cancelar e voltar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuditoriaForm;
