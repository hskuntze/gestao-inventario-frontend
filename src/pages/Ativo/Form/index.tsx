import "./styles.css";
import { Controller, useForm } from "react-hook-form";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Box, Modal } from "@mui/material";

import { requestBackend } from "@/utils/requests";
import {
  fetchAllSetores,
  fetchAllContratos,
  fetchAllFornecedores,
  fetchAllUsuariosResponsaveisByAreaId,
  fetchAllLocalizacoesByAreaId,
} from "@/utils/functions";
import { usePhotoCapture, PhotoCaptureResult } from "@/utils/hooks/usePhotoCapture";
import { getOS, getUserData } from "@/utils/storage";

import UploadArquivos from "@/components/UploadArquivos";
import PhotoCaptureModal from "@/components/PhotoCaptureModal";

import { AtivoType } from "@/types/ativo";
import { HistoricoType } from "@/types/historico";
import CardHistoricoAtivo from "@/components/CardHistoricoAtivo";
import { SetorType } from "@/types/area";
import { UsuarioResponsavelType } from "@/types/usuario_responsavel";
import { FornecedorType } from "@/types/fornecedor";
import { LocalizacaoType } from "@/types/localizacao";
import { ContratoType } from "@/types/contrato";

import AtivoFormLoaderSkeleton from "./AtivoFormLoaderSkeleton";

type FormData = {
  tipoAtivo: string | null;
  gerarIdPatrimonial: boolean;

  idPatrimonial: string;
  categoria: string;
  descricao: string; //descrição = nome (mudança de nomenclatura)
  area: SetorType; //área = setor (mudança de nomenclatura)
  localizacao: LocalizacaoType;
  usuarioResponsavel: UsuarioResponsavelType;
  contrato: ContratoType | null;
  fornecedor: FornecedorType;
  dataAquisicao: string;
  codigoSerie: string;
  observacoes: string;
  estadoConservacao: string;
  dataDevolucaoPrevista: string;
  dataDevolucaoRealizada: string;
  termoParceria: string;
};

type UrlParams = {
  id: string;
};

const AtivoForm = () => {
  const urlParams = useParams<UrlParams>();
  const isEditing = urlParams.id === "create" ? false : true;

  const user = getUserData();

  const [tipoForm, setTipoForm] = useState<"t" | "i" | "tl" | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [ativo, setAtivo] = useState<AtivoType>();
  const [historicoAtivo, setHistoricoAtivo] = useState<HistoricoType[]>();
  const [desabilitado, setDesabilitado] = useState(false);
  const [os, setOs] = useState<string | null>(null);

  const [setores, setSetores] = useState<SetorType[]>([]);
  const [localizacoes, setLocalizacoes] = useState<LocalizacaoType[]>([]);
  const [contratos, setContratos] = useState<ContratoType[]>([]);
  const [allFornecedores, setAllFornecedores] = useState<FornecedorType[]>([]);
  const [usuariosResponsaveis, setUsuariosResponsaveis] = useState<UsuarioResponsavelType[]>([]);

  const [selectedSetor, setSelectedSetor] = useState<SetorType>();
  const [selectedLocalizacao, setSelectedLocalizacao] = useState<LocalizacaoType>();
  const [selectedContrato, setSelectedContrato] = useState<ContratoType | null>(null);
  const [gerarIdPatrimonial, setGerarIdPatrimonial] = useState<boolean>(false);

  const [openModal, setOpenModal] = useState(false);
  const [openAcoes, setOpenAcoes] = useState(false);
  const acoesDropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    resetField,
  } = useForm<FormData>();

  // Photo capture hook + modal state
  const { photoBase64, loading: photoLoading, capturePhoto, captureLocation, reset: resetPhoto } = usePhotoCapture();

  const [photoModalOpen, setPhotoModalOpen] = useState<boolean>(false);
  const [confirmedPhoto, setConfirmedPhoto] = useState<PhotoCaptureResult | null>(null);

  const handleToggleModal = () => {
    setOpenModal(!openModal);
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

  const handleSelectTipoForm = (e: ChangeEvent<HTMLSelectElement>) => {
    let value = e.target.value;

    if (value !== "") {
      setValue("tipoAtivo", value);
      setTipoForm(e.target.value as "t" | "i" | "tl");
    } else {
      setValue("tipoAtivo", null);
      setTipoForm(null);
    }
  };

  const handleDesabilitar = () => {
    let confirm = window.confirm("Deseja mesmo desabilitar este ativo?");

    if (confirm) {
      const requestParams: AxiosRequestConfig = {
        url: "/ativos/desabilitar",
        method: "POST",
        withCredentials: true,
        params: {
          id: urlParams.id,
          razao: "",
        },
      };

      requestBackend(requestParams)
        .then(() => {
          toast.success("Ativo foi desabilitado.");
          navigate("/gestao-inventario/ativo");
        })
        .catch(() => {
          toast.error("Erro ao tentar desabilitar este ativo.");
        });
    }
  };

  const handleDevolver = () => {
    let confirm = window.confirm("Deseja mesmo devolver este ativo? É uma operação irreversível.");

    if (confirm) {
      const requestParams: AxiosRequestConfig = {
        url: "/ativos/devolver",
        method: "POST",
        withCredentials: true,
        params: {
          id: urlParams.id,
        },
      };

      requestBackend(requestParams)
        .then(() => {
          toast.success("Ativo foi devolvido.");
          navigate("/gestao-inventario/ativo");
        })
        .catch(() => {
          toast.error("Erro ao tentar devolver este ativo.");
        });
    }
  };

  const handleDescartar = () => {
    let confirm = window.confirm("Deseja mesmo descartar este ativo? É uma operação irreversível.");

    if (confirm) {
      const requestParams: AxiosRequestConfig = {
        url: "/ativos/descartar",
        method: "POST",
        withCredentials: true,
        params: {
          id: urlParams.id,
        },
      };

      requestBackend(requestParams)
        .then(() => {
          toast.success("Ativo foi descartado.");
          navigate("/gestao-inventario/ativo");
        })
        .catch(() => {
          toast.error("Erro ao tentar descartar este ativo.");
        });
    }
  };

  const handleReload = () => {
    navigate(0);
  };

  const onSubmit = (formData: FormData) => {
    setLoading(true);

    const urlsPost: { [key: string]: string } = {
      t: "/tangiveis/registrar",
      i: "/intangiveis/registrar",
      tl: "/tangiveis/locacao/registrar",
    };

    const urlsPut: { [key: string]: string } = {
      t: `/tangiveis/atualizar/${urlParams.id}`,
      i: `/intangiveis/atualizar/${urlParams.id}`,
      tl: `/tangiveis/locacao/atualizar/${urlParams.id}`,
    };

    if (tipoForm !== null) {
      const requestParams: AxiosRequestConfig = {
        url: isEditing ? urlsPut[tipoForm] : urlsPost[tipoForm],
        method: isEditing ? "PUT" : "POST",
        withCredentials: true,
        data: {
          ...formData,
          fornecedor: {
            id: formData.fornecedor.id,
          },
          area: {
            id: formData.area !== null ? formData.area.id : null,
          },
          localizacao: {
            id: formData.localizacao !== null ? formData.localizacao.id : null,
          },
          usuariosResponsavel: {
            id: formData.usuarioResponsavel.id,
          },
          termoParceria: user.termoParceria,
        },
      };

      requestBackend(requestParams)
        .then((res) => {
          let data = res.data as AtivoType;
          toast.success(isEditing ? "Sucesso ao atualizar o cadastro do ativo" : "Sucesso ao cadastrar novo ativo");
          navigate(`/gestao-inventario/ativo/formulario/${data.id}`);
        })
        .catch((err) => {
          toast.error(isEditing ? "Erro ao tentar atualizar o cadastro do ativo" : "Erro ao tentar realizar o cadastro do ativo");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const onSubmitMovimentacao = (formData: FormData) => {
    const requestParams: AxiosRequestConfig = {
      url: "/ativos/movimentar",
      method: "POST",
      withCredentials: true,
      data: {
        idAtivo: urlParams.id,
        idArea: formData.area.id,
        idLocalizacao: formData.localizacao.id,
        idUsuarioResponsavel: formData.usuarioResponsavel.id,
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        handleToggleModal();
        toast.success("Ativo movimentado com sucesso.");
        loadInfo();
        loadHistoricoInfo();
      })
      .catch((err) => {
        toast.error("Erro ao tentar movimentar ativo.");
      })
      .finally(() => {});
  };

  const loadInfo = useCallback(() => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: `/ativos/${urlParams.id}`,
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        let data = res.data as AtivoType;

        setAtivo(data);

        setDesabilitado(data.desabilitado);
        setGerarIdPatrimonial(data.gerarIdPatrimonial);

        setValue("tipoAtivo", data.tipoAtivo);
        setTipoForm(data.tipoAtivo as "t" | "i" | "tl");

        setValue("area", data.area);
        setSelectedSetor(data.area);

        setValue("localizacao", data.localizacao);
        setSelectedLocalizacao(data.localizacao);

        if (data.contrato === null) {
          setValue("contrato", null);
          setSelectedContrato(null);
        } else {
          setValue("contrato", data.contrato);
        }

        setValue("fornecedor", data.fornecedor);

        setValue("categoria", data.categoria);
        setValue("codigoSerie", data.codigoSerie);
        setValue("dataAquisicao", data.dataAquisicao);
        setValue("descricao", data.descricao);
        setValue("estadoConservacao", data.estadoConservacao);
        setValue("idPatrimonial", data.idPatrimonial);
        setValue("observacoes", data.observacoes);
        setValue("usuarioResponsavel", data.usuarioResponsavel);
        setValue("gerarIdPatrimonial", data.gerarIdPatrimonial);

        setValue("dataDevolucaoPrevista", data.dataDevolucaoPrevista ?? "");
        setValue("dataDevolucaoRealizada", data.dataDevolucaoRealizada ?? "");

        setValue("termoParceria", data.termoParceria);
      })
      .catch((err) => {
        toast.error("Erro ao tentar carregar dados do ativo");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [urlParams.id, setValue]);

  const loadHistoricoInfo = useCallback(() => {
    const requestParams: AxiosRequestConfig = {
      url: `/historico/ativo/${urlParams.id}`,
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        setHistoricoAtivo(res.data as HistoricoType[]);
      })
      .catch((err) => {
        toast.error("Erro ao tentar carregar dados do histórico");
      })
      .finally(() => {});
  }, [urlParams.id]);

  const printQrCode = (image: string) => {
    window.print();
  };

  useEffect(() => {
    if (isEditing) {
      loadInfo();
      loadHistoricoInfo();
    }
  }, [isEditing, loadInfo, loadHistoricoInfo]);

  useEffect(() => {
    async function getSetores() {
      setSetores([]);

      try {
        const data = (await fetchAllSetores()) as SetorType[];
        setSetores(data);
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar setores";
        toast.error(errorMsg);
      }
    }

    getSetores();
  }, []);

  useEffect(() => {
    async function getFornecedores() {
      setAllFornecedores([]);

      try {
        const data = (await fetchAllFornecedores()) as FornecedorType[];
        setAllFornecedores(data.filter((f) => !f.desabilitado));
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar fornecedores";
        toast.error(errorMsg);
      }
    }

    getFornecedores();
  }, []);

  useEffect(() => {
    async function getContratos() {
      setContratos([]);

      try {
        const data = await fetchAllContratos();
        setContratos(data.filter((c) => !c.desabilitado));
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar contratos";
        toast.error(errorMsg);
      }
    }

    getContratos();
  }, []);

  useEffect(() => {
    async function getLocalizacoes() {
      setLocalizacoes([]);

      try {
        if (selectedSetor) {
          const data = await fetchAllLocalizacoesByAreaId(selectedSetor.id);
          setLocalizacoes(data);
        }
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar localizações";
        toast.error(errorMsg);
      }
    }

    getLocalizacoes();
  }, [selectedSetor]);

  useEffect(() => {
    async function getUsuariosResponsaveis() {
      setUsuariosResponsaveis([]);

      try {
        if (selectedSetor) {
          const data = await fetchAllUsuariosResponsaveisByAreaId(selectedSetor.id);
          console.log(data);
          setUsuariosResponsaveis(data.filter((u) => !u.desabilitado));
        }
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar usuários responsáveis";
        toast.error(errorMsg);
      }
    }

    getUsuariosResponsaveis();
  }, [selectedSetor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (acoesDropdownRef.current && !acoesDropdownRef.current.contains(event.target as Node)) {
        setOpenAcoes(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let sistemaOperacional = getOS();

    if (os === null && sistemaOperacional !== undefined) {
      setOs(sistemaOperacional);
    }
  }, [os]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="header-content">
          <h2>Detalhes do Ativo</h2>
          <div className="header-content-buttons">
            <Link to="/gestao-inventario/ativo" type="button" className="voltar-button">
              Voltar
            </Link>
            {isEditing && (
              <div className="acoes-button" ref={acoesDropdownRef}>
                {!desabilitado && (
                  <>
                    <button type="button" className="acoes-toggle" onClick={() => setOpenAcoes(!openAcoes)}>
                      Ações <i className="bi bi-chevron-down" />
                    </button>

                    {openAcoes && (
                      <div className="acoes-menu">
                        <button type="button" disabled={desabilitado} className="movimentacao-button" onClick={handleToggleModal}>
                          Movimentar
                        </button>
                        <button type="button" className="desabilitar-button" onClick={handleDesabilitar}>
                          Desabilitar
                        </button>
                        <button type="button" className="descartar-button" onClick={handleDescartar}>
                          Descartar
                        </button>
                        {ativo?.tipoAtivo === "tl" && (
                          <button type="button" className="devolver-button" onClick={handleDevolver}>
                            Devolver
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal open={openModal} onClose={handleToggleModal} className="modal-container">
        <Box className="modal-content">
          <h2 style={{ textAlign: "center" }}>Movimentar ativo</h2>
          <form className="formulario" onSubmit={handleSubmit(onSubmitMovimentacao)}>
            <div className="div-input-formulario">
              <div>
                <span>Setor</span>
                <span className="obrigatorio-ast">*</span>
              </div>
              <Controller
                name="area"
                control={control}
                rules={{
                  validate: (value) => (!isEditing || (value && value.id) ? true : "Campo obrigatório"),
                }}
                render={({ field }) => (
                  <select
                    id="area"
                    className={`input-formulario ${errors.area ? "input-error" : ""}`}
                    {...field}
                    value={field.value?.id || ""}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const selectedSetor = setores.find((a) => a.id === selectedId) as SetorType;

                      field.onChange(selectedSetor || null);
                      setSelectedSetor(selectedSetor);
                      setLocalizacoes(selectedSetor ? selectedSetor.localizacoes : []);
                    }}
                  >
                    <option value="">Selecione um setor</option>
                    {setores &&
                      setores.length > 0 &&
                      setores.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome}
                        </option>
                      ))}
                  </select>
                )}
              />
              <div className="invalid-feedback d-block div-erro">{errors.area?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>Responsável</span>
              <input type="text" className={`input-formulario disabled-field`} disabled={true} value={selectedSetor?.responsavel} />
            </div>
            <div className="div-input-formulario">
              <div>
                <span>Localização</span>
                <span className="obrigatorio-ast">*</span>
              </div>
              <Controller
                name="localizacao"
                control={control}
                rules={{
                  validate: (value) => (isEditing && selectedSetor && value && value.id ? true : "Campo obrigatório"),
                }}
                render={({ field }) => (
                  <select
                    id="localizacao"
                    className={`input-formulario ${errors.localizacao ? "input-error" : ""}`}
                    {...field}
                    value={field.value?.id || ""}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const selectedLocalizacao = localizacoes.find((a) => a.id === selectedId);

                      field.onChange(selectedLocalizacao || null);
                      setSelectedLocalizacao(selectedLocalizacao);
                    }}
                  >
                    <option value="">Selecione uma localização</option>
                    {localizacoes &&
                      localizacoes.length > 0 &&
                      localizacoes.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome}
                        </option>
                      ))}
                  </select>
                )}
              />
              <div className="invalid-feedback d-block div-erro">{errors.localizacao?.message}</div>
            </div>
            <div className="div-input-formulario">
              <div>
                <span>Usuário responsável</span>
                <span className="obrigatorio-ast">*</span>
              </div>
              <Controller
                name="usuarioResponsavel"
                control={control}
                rules={{
                  required: "Campo obrigatório",
                }}
                render={({ field }) => (
                  <select
                    id="usuarioResponsavel"
                    className={`input-formulario ${errors.usuarioResponsavel ? "input-error" : ""}`}
                    {...field}
                    value={field.value?.id || ""}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const selectedUsuarioResponsavel = usuariosResponsaveis.find((a) => a.id === selectedId);

                      field.onChange(selectedUsuarioResponsavel || null);
                    }}
                  >
                    <option value="">Selecione um usuário responsável</option>
                    {usuariosResponsaveis &&
                      usuariosResponsaveis.length > 0 &&
                      usuariosResponsaveis.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome}
                        </option>
                      ))}
                  </select>
                )}
              />
              <div className="invalid-feedback d-block div-erro">{errors.usuarioResponsavel?.message}</div>
            </div>
            <div className="form-bottom">
              <div className="legenda">* Campos obrigatórios</div>
              <div className="form-buttons">
                <button className="button submit-button">Salvar</button>
              </div>
            </div>
          </form>
        </Box>
      </Modal>

      {/* Photo capture preview/confirm modal (native camera preview handled by Capacitor) */}
      <PhotoCaptureModal
        isOpen={photoModalOpen}
        photoBase64={photoBase64}
        onConfirm={handleConfirmPhoto}
        onRetake={handleRetakePhoto}
        onCancel={handleCancelPhoto}
        loading={photoLoading}
      />

      {loading ? (
        <AtivoFormLoaderSkeleton />
      ) : (
        <>
          <div className="select-tipo-ativo">
            <span>Tipo de ativo</span>
            <Controller
              name="tipoAtivo"
              control={control}
              render={({ field }) => (
                <select
                  id="tipo-ativo"
                  disabled={isEditing ? true : false}
                  className={`input-formulario`}
                  {...field}
                  value={field.value ?? ""}
                  onChange={handleSelectTipoForm}
                >
                  <option value="">Selecione um tipo de ativo</option>
                  <option value="t">Tangível</option>
                  <option value="i">Intangível</option>
                  <option value="tl">Tangível de Locação</option>
                </select>
              )}
            />
          </div>
          {tipoForm !== null && (
            <div className="page-content">
              <div className="page-body">
                <>
                  <div className="content-container bg-card-container">
                    <span className="form-title">Informações do Ativo</span>
                    <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
                      <div className="div-input-formulario text-area-formulario">
                        <div>
                          <span>Nome</span>
                          <span className="obrigatorio-ast">*</span>
                        </div>
                        <textarea
                          id="descricao"
                          className={`input-formulario ${errors.descricao ? "input-error" : ""} ${desabilitado ? "disabled-field" : ""}`}
                          rows={4}
                          {...register("descricao", { required: "Campo obrigatório" })}
                          maxLength={255}
                          disabled={desabilitado}
                        ></textarea>
                        <div className="invalid-feedback d-block div-erro">{errors.descricao?.message}</div>
                      </div>
                      <div className="row-input-fields">
                        <div className="div-input-formulario">
                          <div>
                            <span>ID Patrimonial</span>
                            <span className="obrigatorio-ast">*</span>
                          </div>
                          <input
                            type="text"
                            className={`input-formulario ${errors.idPatrimonial ? "input-error" : ""} ${
                              gerarIdPatrimonial || desabilitado ? "disabled-field" : ""
                            }`}
                            {...register("idPatrimonial", {
                              required: gerarIdPatrimonial ? false : "Campo obrigatório",
                            })}
                            maxLength={255}
                            disabled={gerarIdPatrimonial || desabilitado}
                          />
                          <div className="invalid-feedback d-block div-erro">{errors.idPatrimonial?.message}</div>
                        </div>
                        <div className="div-input-formulario div-input-checkbox">
                          <span>Gerar ID Patrimonial</span>
                          <Controller
                            name="gerarIdPatrimonial"
                            control={control}
                            render={({ field }) => (
                              <input
                                type="checkbox"
                                id="gerarIdPatrimonial"
                                className={`checkbox-input-formulario ${errors.gerarIdPatrimonial ? "input-error" : ""}`}
                                checked={gerarIdPatrimonial}
                                onChange={(e) => {
                                  field.onChange(e.target.checked);
                                  setGerarIdPatrimonial(!gerarIdPatrimonial);
                                }}
                                disabled={isEditing}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="div-input-formulario">
                        <div>
                          <span>Categoria</span>
                          <span className="obrigatorio-ast">*</span>
                        </div>
                        <Controller
                          name="categoria"
                          control={control}
                          rules={{
                            required: "Campo obrigatório",
                          }}
                          render={({ field }) => (
                            <select
                              id="categoria"
                              className={`input-formulario ${errors.categoria ? "input-error" : ""} ${desabilitado ? "disabled-field" : ""}`}
                              {...field}
                              value={field.value}
                              disabled={desabilitado}
                            >
                              <option value="">Selecione uma categoria</option>
                              <option value="ELETRONICO">Eletrônico</option>
                              <option value="ACESSORIO">Acessório</option>
                              <option value="INFORMATICA">Informática</option>
                              <option value="MOBILIARIO">Mobiliário</option>
                              <option value="CERTIFICADO">Certificado</option>
                              <option value="SOFTWARE">Software</option>
                              <option value="EPI">EPI</option>
                            </select>
                          )}
                        />
                        <div className="invalid-feedback d-block div-erro">{errors.categoria?.message}</div>
                      </div>
                      <div className="div-input-formulario">
                        <div>
                          <span>Setor</span>
                          <span className="obrigatorio-ast">*</span>
                        </div>
                        <Controller
                          name="area"
                          control={control}
                          rules={{
                            required: isEditing ? false : "Campo obrigatório",
                          }}
                          render={({ field }) => (
                            <select
                              id="area"
                              className={`input-formulario ${errors.area ? "input-error" : ""} ${!isEditing ? "" : "disabled-field"}`}
                              {...field}
                              value={field.value?.id || ""}
                              onChange={(e) => {
                                const selectedId = Number(e.target.value);
                                const selectedSetor = setores.find((a) => a.id === selectedId) as SetorType;

                                field.onChange(selectedSetor || null);
                                setSelectedSetor(selectedSetor);
                                setLocalizacoes(selectedSetor ? selectedSetor.localizacoes : []);
                              }}
                              disabled={!isEditing ? false : true}
                            >
                              <option value="">Selecione um setor</option>
                              {setores &&
                                setores.length > 0 &&
                                setores.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.nome}
                                  </option>
                                ))}
                            </select>
                          )}
                        />
                        <div className="invalid-feedback d-block div-erro">{errors.area?.message}</div>
                      </div>
                      <div className="div-input-formulario">
                        <span>Responsável</span>
                        <input type="text" className={`input-formulario disabled-field`} disabled={true} value={selectedSetor?.responsavel} />
                      </div>
                      <div className="div-input-formulario">
                        <div>
                          <span>Localização</span>
                          <span className="obrigatorio-ast">*</span>
                        </div>
                        <Controller
                          name="localizacao"
                          control={control}
                          rules={{
                            required: isEditing ? false : "Campo obrigatório",
                          }}
                          render={({ field }) => (
                            <select
                              id="localizacao"
                              className={`input-formulario ${errors.localizacao ? "input-error" : ""} ${
                                (localizacoes !== undefined || selectedLocalizacao !== undefined) && !isEditing && selectedSetor !== undefined
                                  ? ""
                                  : "disabled-field"
                              }`}
                              {...field}
                              value={field.value?.id || ""}
                              onChange={(e) => {
                                const selectedId = Number(e.target.value);
                                const selectedLocalizacao = localizacoes.find((a) => a.id === selectedId);

                                field.onChange(selectedLocalizacao || null);
                                setSelectedLocalizacao(selectedLocalizacao);
                              }}
                              disabled={
                                (localizacoes !== undefined || selectedLocalizacao !== undefined) && !isEditing && selectedSetor !== undefined
                                  ? false
                                  : true
                              }
                            >
                              <option value="">Selecione uma localização</option>
                              {localizacoes &&
                                localizacoes.length > 0 &&
                                localizacoes.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.nome}
                                  </option>
                                ))}
                            </select>
                          )}
                        />
                        <div className="invalid-feedback d-block div-erro">{errors.area?.message}</div>
                      </div>
                      <div className="div-input-formulario">
                        <div>
                          <span>Usuário responsável</span>
                          <span className="obrigatorio-ast">*</span>
                        </div>
                        <Controller
                          name="usuarioResponsavel"
                          control={control}
                          rules={{
                            required: "Campo obrigatório",
                          }}
                          render={({ field }) => (
                            <select
                              id="usuarioResponsavel"
                              className={`input-formulario ${errors.usuarioResponsavel ? "input-error" : ""} ${
                                !isEditing && selectedSetor !== undefined ? "" : "disabled-field"
                              }`}
                              {...field}
                              value={field.value?.id || ""}
                              onChange={(e) => {
                                const selectedId = Number(e.target.value);
                                const selectedUsuarioResponsavel = usuariosResponsaveis.find((a) => a.id === selectedId);

                                field.onChange(selectedUsuarioResponsavel || null);
                              }}
                              disabled={!isEditing && selectedSetor !== undefined ? false : true}
                            >
                              <option value="">Selecione um usuário responsável</option>
                              {usuariosResponsaveis &&
                                usuariosResponsaveis.length > 0 &&
                                usuariosResponsaveis.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.nome}
                                  </option>
                                ))}
                            </select>
                          )}
                        />
                        <div className="invalid-feedback d-block div-erro">{errors.usuarioResponsavel?.message}</div>
                      </div>
                      <div className="div-input-formulario">
                        <div>
                          <span>Contrato</span>
                          <span className="obrigatorio-ast">*</span>
                        </div>
                        <Controller
                          name="contrato"
                          control={control}
                          rules={{
                            validate: (value) => {
                              if (value === null || value?.id === null) {
                                return true; // Aceita "sem contrato"
                              }
                              return true; // Tudo ok
                            },
                            required: "Campo obrigatório",
                          }}
                          render={({ field }) => (
                            <select
                              id="contrato"
                              className={`input-formulario ${errors.contrato ? "input-error" : ""} ${desabilitado ? "disabled-field" : ""}`}
                              {...field}
                              value={field.value === null ? "-1" : field.value?.id?.toString()}
                              onChange={(e) => {
                                const selectedValue = e.target.value;
                                if (selectedValue === "-1") {
                                  // Se não tiver contrato...
                                  setSelectedContrato(null);
                                  setValue("dataDevolucaoPrevista", "");
                                  resetField("dataDevolucaoPrevista");
                                  // Libera o campo de fornecedor
                                  resetField("dataDevolucaoPrevista");

                                  // No form, o valor será null (sem contrato)
                                  field.onChange({ id: null });
                                } else {
                                  const selectedId = Number(selectedValue);
                                  const sContrato = contratos.find((a) => a.id === selectedId) || null;

                                  if (sContrato !== null) {
                                    setSelectedContrato(sContrato);
                                    setValue("dataDevolucaoPrevista", sContrato.fimDataVigencia);
                                    setValue("fornecedor", sContrato.fornecedor); // preenche fornecedor automaticamente
                                  } else {
                                    setSelectedContrato(null);
                                    resetField("dataDevolucaoPrevista");
                                    resetField("fornecedor");
                                  }

                                  field.onChange(sContrato);
                                }
                              }}
                              disabled={desabilitado}
                            >
                              <option value="">Selecione um contrato</option>
                              {contratos &&
                                contratos.length > 0 &&
                                contratos.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.numeroContrato}
                                  </option>
                                ))}
                            </select>
                          )}
                        />
                        <div className="invalid-feedback d-block div-erro">{errors.contrato?.message}</div>
                      </div>
                      <div className="div-input-formulario">
                        <span>Fornecedor</span>
                        <Controller
                          name="fornecedor"
                          control={control}
                          render={({ field }) => (
                            <select
                              id="fornecedor"
                              className={`input-formulario ${errors.fornecedor ? "input-error" : ""} disabled-field`}
                              {...field}
                              value={field.value?.id || ""}
                              onChange={(e) => {
                                const selectedId = Number(e.target.value);
                                const fornecedorSelecionado = allFornecedores.find((f) => f.id === selectedId) || null;

                                if (fornecedorSelecionado !== null) {
                                  field.onChange(fornecedorSelecionado);
                                }
                              }}
                              disabled={true}
                            >
                              <option value="">Selecione um fornecedor</option>
                              {allFornecedores &&
                                allFornecedores.length > 0 &&
                                allFornecedores.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.nome}
                                  </option>
                                ))}
                            </select>
                          )}
                        />
                        <div className="invalid-feedback d-block div-erro">{errors.fornecedor?.message}</div>
                      </div>
                      <div className="div-input-formulario">
                        <div>
                          <span>Data aquisição</span>
                          <span className="obrigatorio-ast">*</span>
                        </div>
                        <input
                          type="date"
                          className={`input-formulario data-input ${errors.dataAquisicao ? "input-error" : ""} ${
                            desabilitado ? "disabled-field" : ""
                          }`}
                          {...register("dataAquisicao", { required: "Campo obrigatório" })}
                          disabled={desabilitado}
                        />
                        <div className="invalid-feedback d-block div-erro">{errors.dataAquisicao?.message}</div>
                      </div>
                      {tipoForm === "tl" && (
                        <>
                          <div className="div-input-formulario">
                            <div>
                              <span>Data de devolução prevista</span>
                              <span className="obrigatorio-ast">*</span>
                            </div>
                            <input
                              type="date"
                              className={`input-formulario data-input ${errors.dataDevolucaoPrevista ? "input-error" : ""} ${
                                desabilitado || selectedContrato !== null ? "disabled-field" : ""
                              }`}
                              {...register("dataDevolucaoPrevista", { required: "Campo obrigatório" })}
                              disabled={desabilitado || selectedContrato !== null}
                            />
                            <div className="invalid-feedback d-block div-erro">{errors.dataDevolucaoPrevista?.message}</div>
                          </div>
                          {/*
                          * ============================================================================================================
                          * ========== Este trecho de código será movido para o modal em que se realiza a ação de "devolução" ==========
                          * ============================================================================================================
                          <div className="div-input-formulario">
                            <span>Data em que foi realizada a devolução</span>
                            <input
                              type="date"
                              className={`input-formulario data-input ${errors.dataDevolucaoRealizada ? "input-error" : ""} ${
                                desabilitado ? "disabled-field" : ""
                              }`}
                              {...register("dataDevolucaoRealizada")}
                              disabled={desabilitado}
                            />
                            <div className="invalid-feedback d-block div-erro">{errors.dataDevolucaoRealizada?.message}</div>
                          </div> */}
                        </>
                      )}
                      {tipoForm !== "i" && (
                        <div className="div-input-formulario">
                          <div>
                            <span>Estado de conservação</span>
                            <span className="obrigatorio-ast">*</span>
                          </div>
                          <Controller
                            name="estadoConservacao"
                            control={control}
                            rules={{
                              required: "Campo obrigatório",
                            }}
                            render={({ field }) => (
                              <select
                                id="estadoConservacao"
                                className={`input-formulario ${errors.estadoConservacao ? "input-error" : ""} ${
                                  desabilitado ? "disabled-field" : ""
                                }`}
                                {...field}
                                value={field.value}
                                disabled={desabilitado}
                              >
                                <option value="">Selecione um estado de conservação</option>
                                <option value="Novo">Novo</option>
                                <option value="Ótimo">Ótimo</option>
                                <option value="Bom">Bom</option>
                                <option value="Ruim">Ruim</option>
                              </select>
                            )}
                          />
                          <div className="invalid-feedback d-block div-erro">{errors.estadoConservacao?.message}</div>
                        </div>
                      )}
                      <div className="div-input-formulario">
                        <div>
                          <span>Código de série</span>
                          <span className="obrigatorio-ast">*</span>
                        </div>
                        <input
                          type="text"
                          className={`input-formulario ${errors.codigoSerie ? "input-error" : ""} ${desabilitado ? "disabled-field" : ""}`}
                          {...register("codigoSerie", { required: "Campo obrigatório" })}
                          maxLength={255}
                          disabled={desabilitado}
                        />
                        <div className="invalid-feedback d-block div-erro">{errors.codigoSerie?.message}</div>
                      </div>
                      <div className="div-input-formulario"></div>
                      <div className="div-input-formulario text-area-formulario">
                        <span>Descrição/Observações</span>
                        <textarea
                          id="observacoes"
                          className={`input-formulario ${desabilitado ? "disabled-field" : ""}`}
                          rows={4}
                          {...register("observacoes")}
                          maxLength={255}
                          disabled={desabilitado}
                        ></textarea>
                      </div>
                      <div className="form-bottom">
                        <div className="legenda">* Campos obrigatórios</div>
                        <div className="form-buttons">
                          <button className={`button submit-button ${desabilitado ? "disabled-field" : ""}`} disabled={desabilitado}>
                            Salvar
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                  {isEditing && (
                    <div className="content-container bg-card-container">
                      <span className="form-title">Anexos</span>
                      {(os === "Android" || os === "iOS") && (
                        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                          <button
                            type="button"
                            className="button"
                            onClick={async () => {
                              // open camera to take a photo (preview handled by modal below)
                              await capturePhoto();
                              setPhotoModalOpen(true);
                            }}
                            disabled={desabilitado}
                          >
                            📸 Tirar Foto
                          </button>
                          <span style={{ color: "#666" }}>Tire uma foto do ativo e confirme para visualizar abaixo.</span>
                        </div>
                      )}
                      {ativo ? (
                        <UploadArquivos
                          tipoAtivo={tipoForm}
                          idAtivo={String(ativo.id)}
                          defaultFiles={ativo?.imagens}
                          ativoDesabilitado={desabilitado}
                          reloadPage={handleReload}
                        />
                      ) : (
                        <UploadArquivos tipoAtivo={tipoForm} ativoDesabilitado={desabilitado} reloadPage={handleReload} />
                      )}

                      {/* Inline preview of confirmed photo */}
                      {confirmedPhoto && (
                        <div className="inline-photo-preview" style={{ marginTop: 12 }}>
                          <span className="form-title">Foto Capturada</span>
                          <div style={{ marginTop: 8 }}>
                            <img
                              src={`data:image/jpeg;base64,${confirmedPhoto.photoBase64}`}
                              alt="Foto do ativo"
                              style={{ maxWidth: "100%", borderRadius: 6 }}
                            />
                            <div style={{ marginTop: 8, color: "#444" }}>
                              <div>Latitude: {confirmedPhoto.latitude ?? "—"}</div>
                              <div>Longitude: {confirmedPhoto.longitude ?? "—"}</div>
                              <div>Timestamp: {confirmedPhoto.timestamp}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              </div>
              <div className="page-side-section">
                <div className="content-container">
                  <span className="form-title">Histórico do Ativo</span>
                  <div className="historico-body">
                    {ativo && historicoAtivo ? (
                      historicoAtivo.map((h) => <CardHistoricoAtivo key={h.id} element={h} />)
                    ) : (
                      <div className="no-info">Sem histórico a ser exibido</div>
                    )}
                  </div>
                </div>
                {ativo && (
                  <div className="content-container qr-container">
                    <button onClick={() => printQrCode(ativo.qrCodeImage)} type="button" className="print-button">
                      <i className="bi bi-printer print-qr-code-icon" />
                    </button>
                    <img className="qr-image" src={`data:image/png;base64,${ativo.qrCodeImage}`} alt="QRCode" />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AtivoForm;
