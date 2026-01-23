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
import Loader from "@/components/Loader";

type TipoMovimentacao = "MOVIMENTAR" | "MANUTENÇÃO" | "RETIRAR MANUTENÇÃO" | "ESTOQUE";
type TipoForm = "t" | "i" | "tl";

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
  dataAquisicao: string; //data aquisição = data do recebimento (mudança de nomenclatura)
  numeroParte: string;
  codigoSerie: string;
  observacoes: string;
  estadoConservacao: string;
  dataDevolucaoPrevista: string;
  dataDevolucaoRealizada: string;
  termoParceria: string;
  passivelEmprestimo: boolean;
};

type FormDataDesabilitar = {
  razaoDesabilitado: string;
  observacoesDesabilitado: string;
};

type FormDataManutencao = {
  manutencao: boolean;
  observacoesManutencao: string;
};

type UrlParams = {
  id: string;
};

const AtivoForm = () => {
  const urlParams = useParams<UrlParams>();
  const isEditing = urlParams.id === "create" ? false : true;

  const user = getUserData();

  const [tipoForm, setTipoForm] = useState<TipoForm | null>(null);
  const [tipoMovimentar, setTipoMovimentar] = useState<TipoMovimentacao | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPrint, setLoadingPrint] = useState<boolean>(false);
  const [ativo, setAtivo] = useState<AtivoType>();
  const [historicoAtivo, setHistoricoAtivo] = useState<HistoricoType[]>();
  const [desabilitado, setDesabilitado] = useState<boolean>(false);
  const [os, setOs] = useState<string | null>(null);

  // Opções
  const [setores, setSetores] = useState<SetorType[]>([]);
  const [localizacoes, setLocalizacoes] = useState<LocalizacaoType[]>([]);
  const [contratos, setContratos] = useState<ContratoType[]>([]);
  const [allFornecedores, setAllFornecedores] = useState<FornecedorType[]>([]);
  const [usuariosResponsaveis, setUsuariosResponsaveis] = useState<UsuarioResponsavelType[]>([]);

  // Seleção de opções
  const [selectedSetor, setSelectedSetor] = useState<SetorType>();
  const [gerarIdPatrimonial, setGerarIdPatrimonial] = useState<boolean>(false);
  const [checkPassivelEmprestimo, setCheckPassivelEmprestimo] = useState<boolean>(false);
  const [codigoSerieNA, setCodigoSerieNA] = useState<boolean>(false);
  const [codigoSerieAtivoNuvem, setCodigoSerieAtivoNuvem] = useState<boolean>(false);

  // Estado dos modais (aberto ou não)
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [openModalDesabilitar, setOpenModalDesabilitar] = useState<boolean>(false);
  const [openAcoes, setOpenAcoes] = useState<boolean>(false);

  const acoesDropdownRef = useRef<HTMLDivElement>(null);

  // Opções de tamanho do QRCode
  const [selectedTamanhoQrCode, setSelectedTamanhoQrCode] = useState<"PP" | "P" | "M" | "G" | null>(null);

  const navigate = useNavigate();

  // Form padrão (registro | edição)
  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    resetField,
  } = useForm<FormData>();

  // Form para desabilitar ativo
  const {
    register: registerDesabilitar,
    control: controlDesabilitar,
    formState: { errors: errorsDesabilitar },
    handleSubmit: handleSubmitDesabilitar,
  } = useForm<FormDataDesabilitar>();

  // Form para manutenção
  const { register: registerManutencao, handleSubmit: handleSubmitManutencao } = useForm<FormDataManutencao>();

  // Photo capture hook + modal state
  const { photoBase64, loading: photoLoading, capturePhoto, captureLocation, reset: resetPhoto } = usePhotoCapture();

  // Auxiliares para tirar foto (app)
  const [photoModalOpen, setPhotoModalOpen] = useState<boolean>(false);
  const [confirmedPhoto, setConfirmedPhoto] = useState<PhotoCaptureResult | null>(null);

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

  /**
   * Trata a escolha do tipo de ativo
   */
  const handleSelectTipoForm = (e: ChangeEvent<HTMLSelectElement>) => {
    let value = e.target.value;

    if (value !== "") {
      setValue("tipoAtivo", value);
      setTipoForm(e.target.value as TipoForm);
    } else {
      setValue("tipoAtivo", null);
      setTipoForm(null);
    }
  };

  /**
   * Trata a ação de devolução do ativo
   * 
   * Endpoint: "/ativos/devolver"
   */
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

  const handleReload = () => {
    navigate(0);
  };

  /**
   * onSubmit do formulário padrão (registro | edição). Caso a requisição seja realizada
   * com sucesso o usuário é redirecionado para a página de edição do ativo que acabou de
   * ser registrado. Isso acontece para que o usuário possa realizar o upload de arquivos,
   * que só é habilitado para a edição de ativos. 
   * @param formData: FormData 
   */
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

    let areaId = formData.area !== undefined && formData.area !== null ? formData.area.id : null;
    let fornecedorId = formData.fornecedor !== undefined && formData.fornecedor !== null ? formData.fornecedor.id : null;
    let localizacaoId = formData.localizacao !== undefined && formData.localizacao !== null ? formData.localizacao.id : null;
    let usuarioResponsavelId =
      formData.usuarioResponsavel !== undefined && formData.usuarioResponsavel !== null ? formData.usuarioResponsavel.id : null;

    if (tipoForm !== null) {
      const requestParams: AxiosRequestConfig = {
        url: isEditing ? urlsPut[tipoForm] : urlsPost[tipoForm],
        method: isEditing ? "PUT" : "POST",
        withCredentials: true,
        data: {
          ...formData,
          fornecedor: {
            id: fornecedorId,
          },
          area: {
            id: areaId,
          },
          localizacao: {
            id: localizacaoId,
          },
          usuariosResponsavel: {
            id: usuarioResponsavelId,
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

  /**
   * onSubmit para o form de movimentação do ativo. Isso ativa o recarregamento das informações do ativo,
   * bem como recarreg as informações de histórico do mesmo.
   * @param formData 
   */
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
        toast.success("Ativo movimentado com sucesso.");
        loadInfo();
        loadHistoricoInfo();
        setOpenModal(false);
      })
      .catch((err) => {
        toast.error("Erro ao tentar movimentar ativo.");
      })
      .finally(() => {});
  };

  /**
   * onSubmit para o form de desabilitar o ativo
   * @param formData 
   */
  const onSubmitDesabilitar = (formData: FormDataDesabilitar) => {
    let confirm = window.confirm("Deseja mesmo desabilitar este ativo? Trata-se de uma operação irreversível.");

    if (confirm) {
      const requestParams: AxiosRequestConfig = {
        url: "/ativos/desabilitar",
        method: "POST",
        withCredentials: true,
        params: {
          id: urlParams.id,
          razao: formData.razaoDesabilitado,
          observacao: formData.observacoesDesabilitado,
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

  /**
   * onSubmit para o form de manutenção do ativo
   * @param formData 
   */
  const onSubmitManutencao = (formData: FormDataManutencao) => {
    let confirm = window.confirm("Deseja mesmo colocar este ativo em manutenção?");

    if (confirm) {
      const requestParams: AxiosRequestConfig = {
        url: "/ativos/manutencao/colocar",
        method: "POST",
        withCredentials: true,
        params: {
          id: urlParams.id,
          observacao: formData.observacoesManutencao,
        },
      };

      requestBackend(requestParams)
        .then(() => {
          toast.success("Ativo colocado em manutenção.");
          navigate("/gestao-inventario/ativo");
        })
        .catch(() => {
          toast.error("Erro ao tentar colocar ativo em manutenção.");
        });
    }
  };

  /**
   * onSubmit para o form que retira o ativo da manutenção
   * @param formData 
   */
  const onSubmitRetirarManutencao = () => {
    let confirm = window.confirm("Deseja mesmo retirar este ativo da manutenção?");

    if (confirm) {
      const requestParams: AxiosRequestConfig = {
        url: "/ativos/manutencao/retirar",
        method: "POST",
        withCredentials: true,
        params: {
          id: urlParams.id,
        },
      };

      requestBackend(requestParams)
        .then(() => {
          toast.success("Ativo retirado da manutenção.");
          navigate("/gestao-inventario/ativo");
        })
        .catch(() => {
          toast.error("Erro ao tentar retirar ativo da manutenção.");
        });
    }
  };

  const submitDesabilitar = () => {
    handleSubmitDesabilitar(onSubmitDesabilitar)();
  };

  /**
   * Carrega as informações do ativo, setando os atributos para edição
   */
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
        setCheckPassivelEmprestimo(data.passivelEmprestimo);

        setValue("tipoAtivo", data.tipoAtivo);
        setTipoForm(data.tipoAtivo as "t" | "i" | "tl");

        // ----- [INÍCIO] POSSÍVEIS ELEMENTOS NULOS [INÍCIO] -----
        setValue("area", data.area);
        setSelectedSetor(data.area);

        setValue("localizacao", data.localizacao);
        setValue("contrato", data.contrato);
        setValue("fornecedor", data.fornecedor);
        console.log("fornecedor", data.fornecedor);
        setValue("usuarioResponsavel", data.usuarioResponsavel);

        setValue("dataDevolucaoPrevista", data.dataDevolucaoPrevista ?? "");
        setValue("dataDevolucaoRealizada", data.dataDevolucaoRealizada ?? "");
        // ----- [FIM] POSSÍVEIS ELEMENTOS NULOS [FIM] -----

        setValue("categoria", data.categoria);
        setValue("numeroParte", data.numeroParte);
        setValue("codigoSerie", data.codigoSerie);
        if (data.codigoSerie === "N/A") {
          setCodigoSerieNA(true);
        } else if (data.codigoSerie === "Ativação realizada na Nuvem") {
          setCodigoSerieAtivoNuvem(true);
        }

        setValue("dataAquisicao", data.dataAquisicao);
        setValue("descricao", data.descricao);
        setValue("estadoConservacao", data.estadoConservacao);
        setValue("idPatrimonial", data.idPatrimonial);
        setValue("passivelEmprestimo", data.passivelEmprestimo);
        setValue("observacoes", data.observacoes);
        setValue("gerarIdPatrimonial", data.gerarIdPatrimonial);
        setValue("termoParceria", data.termoParceria);
      })
      .catch((err) => {
        toast.error("Erro ao tentar carregar dados do ativo");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [urlParams.id, setValue]);

  /**
   * Função responsável por carregar os dados de histórico do ativo
   */
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

  /**
   * Função auxiliar que recebe o blob de pdf do QRCode gerado no back-end e ativa a função de imprimir
   * com o conteúdo do blob.
   * @param pdfBlob
   */
  const imprimirPdf = (pdfBlob: Blob) => {
    const blobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }));

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = blobUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.print();
    };
  };

  /**
   * Função que chama o endpoint que gera o QRCode (tag) do ativo
   * @param ativo
   */
  const printQrCode = (ativo: AtivoType) => {
    if (selectedTamanhoQrCode !== null) {
      setLoadingPrint(true);

      const urls: { [key: string]: string } = {
        t: `/tangiveis/qrcode/${ativo.id}`,
        i: `/intangiveis/qrcode/${ativo.id}`,
        tl: `/tangiveis/locacao/qrcode/${ativo.id}`,
      };

      const requestParams: AxiosRequestConfig = {
        url: urls[ativo.tipoAtivo],
        method: "GET",
        withCredentials: true,
        responseType: "blob",
        params: {
          tamanho: selectedTamanhoQrCode,
        },
      };

      requestBackend(requestParams)
        .then((res) => {
          imprimirPdf(res.data);
        })
        .catch((err) => {})
        .finally(() => setLoadingPrint(false));
    }
  };

  useEffect(() => {
    if (isEditing) {
      loadInfo();
      loadHistoricoInfo();
    }
  }, [isEditing, loadInfo, loadHistoricoInfo]);

  /**
   * FUNÇÕES AUXILIARES QUE CARREGAM AS OPÇÕES
   */
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

  // Função auxiliar que carrega o sistema operacional (app)
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
            {!isEditing && (
              <div className="acoes-button">
                <Link to="/gestao-inventario/ativo/formulario/lote/create">
                  <button className="acoes-toggle auto-width" type="button">
                    Adicionar em Lote
                  </button>
                </Link>
              </div>
            )}
            {isEditing && (
              <div className="acoes-button" ref={acoesDropdownRef}>
                {!desabilitado && (
                  <>
                    <button type="button" className="acoes-toggle" onClick={() => setOpenAcoes(!openAcoes)}>
                      Ações <i className="bi bi-chevron-down" />
                    </button>

                    {openAcoes && (
                      <div className="acoes-menu">
                        <button type="button" disabled={desabilitado} className="movimentacao-button" onClick={() => setOpenModal(true)}>
                          Movimentar
                        </button>
                        {ativo?.tipoAtivo === "t" && (
                          <button type="button" className="desabilitar-button" onClick={() => setOpenModalDesabilitar(true)}>
                            Desabilitar
                          </button>
                        )}
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

      {/* 
        MODAL PARA MOVIMENTAÇÃO DO ATIVO
      */}
      <Modal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setTipoMovimentar(null);
        }}
        className="modal-container"
      >
        <Box className="modal-content">
          <h2 style={{ textAlign: "center" }}>Movimentar ativo</h2>
          <div className="div-input-formulario">
            <select
              className={`input-formulario`}
              name="tipo-movimentacao"
              id="tipo-movimentacao"
              onChange={(e) => setTipoMovimentar(e.target.value as TipoMovimentacao)}
            >
              <option value="">Selecione um tipo de movimentação</option>
              <option value="MOVIMENTAR">Movimentação</option>
              {!ativo?.manutencao && <option value="MANUTENÇÃO">Manutenção</option>}
              {ativo?.manutencao && <option value="RETIRAR MANUTENÇÃO">Retirar da Manutenção</option>}
              <option value="ESTOQUE">Estoque</option>
            </select>
          </div>
          {tipoMovimentar === "MOVIMENTAR" && (
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
          )}
          {tipoMovimentar === "MANUTENÇÃO" && (
            <form className="formulario" onSubmit={handleSubmitManutencao(onSubmitManutencao)}>
              <div className="div-input-formulario text-area-formulario">
                <div>
                  <span>Observações</span>
                  <span className="obrigatorio-ast">*</span>
                </div>
                <textarea
                  id="observacoesManutencao"
                  className={`input-formulario ${errors.descricao ? "input-error" : ""} ${desabilitado ? "disabled-field" : ""}`}
                  rows={4}
                  {...registerManutencao("observacoesManutencao", {
                    required: "Campo obrigatório",
                  })}
                  maxLength={255}
                ></textarea>
                <div className="invalid-feedback d-block div-erro">{errors.descricao?.message}</div>
              </div>
              <div className="form-bottom">
                <div className="legenda">* Campos obrigatórios</div>
                <div className="form-buttons">
                  <button className="button submit-button">Salvar</button>
                </div>
              </div>
            </form>
          )}
          {tipoMovimentar === "RETIRAR MANUTENÇÃO" && (
            <div className="form-bottom">
              <div className="form-buttons">
                <button className="button submit-button" onClick={onSubmitRetirarManutencao}>
                  Salvar
                </button>
              </div>
            </div>
          )}
        </Box>
      </Modal>

      {/* 
        MODAL PARA DESABILITAR ATIVO
      */}
      <Modal open={openModalDesabilitar} onClose={() => setOpenModalDesabilitar(false)} className="modal-container">
        <Box className="modal-content desabilitar-modal">
          <h2 style={{ textAlign: "center" }}>Desabilitar ativo</h2>
          <form className="formulario" onSubmit={handleSubmitDesabilitar(onSubmitDesabilitar)}>
            <div className="div-input-formulario w-100">
              <div>
                <span>Motivo</span>
                <span className="obrigatorio-ast">*</span>
              </div>
              <Controller
                name="razaoDesabilitado"
                control={controlDesabilitar}
                rules={{
                  required: "Campo obrigatório",
                }}
                render={({ field }) => (
                  <select
                    id="localizacao"
                    className={`input-formulario ${errorsDesabilitar.razaoDesabilitado ? "input-error" : ""}`}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const razao = e.target.value;
                      field.onChange(razao);
                    }}
                  >
                    <option value="">Selecione um motivo</option>
                    <option value="OBSOLECÊNCIA">ATIVO OBSOLETO</option>
                    <option value="IRRECUPERÁVEL">IRRECUPERÁVEL</option>
                    <option value="INUTILIZÁVEL">INUTILIZÁVEL</option>
                    <option value="OUTROS">OUTROS</option>
                  </select>
                )}
              />
              <div className="invalid-feedback d-block div-erro">{errorsDesabilitar.razaoDesabilitado?.message}</div>
            </div>
            <div className="div-input-formulario text-area-formulario">
              <span>Observações</span>
              <textarea
                id="observacoesDesabilitado"
                className={`input-formulario`}
                rows={4}
                {...registerDesabilitar("observacoesDesabilitado")}
                maxLength={255}
              ></textarea>
            </div>
          </form>
          {ativo && tipoForm && (
            <UploadArquivos
              tipoAtivo={tipoForm}
              idAtivo={String(ativo.id)}
              defaultFiles={ativo?.imagens}
              ativoDesabilitado={desabilitado}
              submitParentForm={submitDesabilitar}
            />
          )}
        </Box>
      </Modal>

      {/* MODAL PARA CAPTURA DE FOTO E PREVIEW (preview nativo da câmera gerenciado pelo Capacitor) */}
      <PhotoCaptureModal
        isOpen={photoModalOpen}
        photoBase64={photoBase64}
        onConfirm={handleConfirmPhoto}
        onRetake={handleRetakePhoto}
        onCancel={handleCancelPhoto}
        loading={photoLoading}
      />

      {/* FORMULÁRIO DE REGISTRO | EDIÇÃO */}
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
                      <div className="div-input-formulario w-100">
                        <div>
                          <span>Nome</span>
                          <span className="obrigatorio-ast">*</span>
                        </div>
                        <input
                          id="descricao"
                          className={`input-formulario ${errors.descricao ? "input-error" : ""} ${isEditing ? "disabled-field" : ""}`}
                          type="text"
                          {...register("descricao", { required: "Campo obrigatório" })}
                          maxLength={255}
                          disabled={isEditing}
                        />
                        <div className="invalid-feedback d-block div-erro">{errors.descricao?.message}</div>
                      </div>
                      <div className="div-input-formulario text-area-formulario">
                        <span>Descrição</span>
                        <textarea
                          id="observacoes"
                          className={`input-formulario ${isEditing ? "disabled-field" : ""}`}
                          rows={4}
                          {...register("observacoes")}
                          maxLength={255}
                          disabled={isEditing}
                        ></textarea>
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
                              gerarIdPatrimonial || isEditing ? "disabled-field" : ""
                            }`}
                            {...register("idPatrimonial", {
                              required: gerarIdPatrimonial ? false : "Campo obrigatório",
                            })}
                            maxLength={255}
                            disabled={gerarIdPatrimonial || isEditing}
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
                              className={`input-formulario ${errors.categoria ? "input-error" : ""} ${isEditing ? "disabled-field" : ""}`}
                              {...field}
                              value={field.value}
                              disabled={isEditing}
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
                              className={`input-formulario ${errors.contrato ? "input-error" : ""} ${isEditing ? "disabled-field" : ""}`}
                              {...field}
                              value={field.value === null ? "-1" : field.value?.id?.toString()}
                              onChange={(e) => {
                                const selectedValue = e.target.value;
                                if (selectedValue === "-1") {
                                  // Se não tiver contrato...
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
                                    setValue("dataDevolucaoPrevista", sContrato.fimDataVigencia);
                                    setValue("fornecedor", sContrato.fornecedor); // preenche fornecedor automaticamente
                                  } else {
                                    resetField("dataDevolucaoPrevista");
                                    resetField("fornecedor");
                                  }

                                  field.onChange(sContrato);
                                }
                              }}
                              disabled={isEditing}
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
                        <div>
                          <span>Fornecedor</span>
                        </div>
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
                      {tipoForm === "tl" && (
                        <>
                          <div className="div-input-formulario">
                            <div>
                              <span>Data de devolução prevista</span>
                            </div>
                            <input
                              type="date"
                              className={`input-formulario data-input ${errors.dataDevolucaoPrevista ? "input-error" : ""} disabled-field`}
                              {...register("dataDevolucaoPrevista")}
                              disabled={true}
                            />
                            <div className="invalid-feedback d-block div-erro">{errors.dataDevolucaoPrevista?.message}</div>
                          </div>
                        </>
                      )}
                      <div className="div-input-formulario">
                        <div>
                          <span>Data do recebimento</span>
                          <span className="obrigatorio-ast">*</span>
                        </div>
                        <input
                          type="date"
                          defaultValue={new Date().toISOString().split("T")[0]}
                          className={`input-formulario data-input ${errors.dataAquisicao ? "input-error" : ""} ${isEditing ? "disabled-field" : ""}`}
                          {...register("dataAquisicao", { required: "Campo obrigatório" })}
                          disabled={isEditing}
                        />
                        <div className="invalid-feedback d-block div-erro">{errors.dataAquisicao?.message}</div>
                      </div>
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
                                className={`input-formulario ${errors.estadoConservacao ? "input-error" : ""} ${isEditing ? "disabled-field" : ""}`}
                                {...field}
                                value={field.value}
                                disabled={isEditing}
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
                      {tipoForm !== "i" && (
                        <div className="div-input-formulario">
                          <div>
                            <span>PartNumber (PN)</span>
                          </div>
                          <input
                            type="text"
                            className={`input-formulario ${errors.numeroParte ? "input-error" : ""} ${isEditing ? "disabled-field" : ""}`}
                            {...register("numeroParte")}
                            maxLength={255}
                            disabled={isEditing}
                          />
                          <div className="invalid-feedback d-block div-erro">{errors.numeroParte?.message}</div>
                        </div>
                      )}
                      <div className="row-input-fields">
                        <div className="div-input-formulario div-input-checkbox">
                          <span>Passível de Empréstimo</span>
                          <Controller
                            name="passivelEmprestimo"
                            control={control}
                            render={({ field }) => (
                              <input
                                type="checkbox"
                                id="passivelEmprestimo"
                                className={`checkbox-input-formulario ${errors.passivelEmprestimo ? "input-error" : ""}`}
                                checked={checkPassivelEmprestimo}
                                onChange={(e) => {
                                  field.onChange(e.target.checked);
                                  setCheckPassivelEmprestimo(!checkPassivelEmprestimo);
                                }}
                                disabled={isEditing}
                              />
                            )}
                          />
                          <span>Este ativo pode ser emprestado?</span>
                        </div>
                      </div>
                      <div className="row-input-fields w-100">
                        <div className="div-input-formulario">
                          <div>
                            <span>Número de série</span>
                            <span className="obrigatorio-ast">*</span>
                          </div>
                          <input
                            type="text"
                            className={`input-formulario ${errors.codigoSerie ? "input-error" : ""} 
                              ${isEditing ? "disabled-field" : ""} 
                              ${codigoSerieNA || codigoSerieAtivoNuvem ? "disabled-field" : ""}`}
                            {...register("codigoSerie", { required: "Campo obrigatório" })}
                            maxLength={255}
                            disabled={isEditing || codigoSerieNA || codigoSerieAtivoNuvem}
                          />
                          <div className="invalid-feedback d-block div-erro">{errors.codigoSerie?.message}</div>
                        </div>
                        <div className="div-input-formulario div-input-checkbox">
                          <span>N/A</span>
                          <input
                            type="checkbox"
                            id="check-codigo-na"
                            className={`checkbox-input-formulario`}
                            checked={codigoSerieNA}
                            onChange={(e) => {
                              let value = e.target.checked;
                              setCodigoSerieNA(value);

                              if (value === true) {
                                setValue("codigoSerie", "N/A");
                                setCodigoSerieAtivoNuvem(false);
                              } else {
                                resetField("codigoSerie");
                              }
                            }}
                            disabled={codigoSerieAtivoNuvem || isEditing}
                          />
                        </div>
                        {tipoForm === "i" && (
                          <div className="div-input-formulario div-input-checkbox">
                            <span>Ativação realizada na Nuvem</span>
                            <input
                              type="checkbox"
                              id="check-ativo-nuvem"
                              className={`checkbox-input-formulario`}
                              checked={codigoSerieAtivoNuvem}
                              onChange={(e) => {
                                let value = e.target.checked;
                                setCodigoSerieAtivoNuvem(value);

                                if (value === true) {
                                  setValue("codigoSerie", "Ativação realizada na Nuvem");
                                  setCodigoSerieNA(false);
                                } else {
                                  resetField("codigoSerie");
                                }
                              }}
                              disabled={codigoSerieNA || isEditing}
                            />
                          </div>
                        )}
                      </div>
                      <div className="form-bottom">
                        <div className="legenda">* Campos obrigatórios</div>
                        <div className="form-buttons">
                          <button className={`button submit-button ${isEditing ? "disabled-field" : ""}`} disabled={isEditing}>
                            Salvar
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* SE ESTIVER EM MODO DE EDIÇÃO O COMPONENTE DE ANEXOS É EXIBIDO */}
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
                          defaultFiles={ativo.imagens}
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
                
                {/* SE ESTIVER EM MODO DE EDIÇÃO O COMPONENTE DE QRCODE (TAG) É EXIBIDO */}
                {ativo && (
                  <div className="content-container qr-container">
                    {loadingPrint ? (
                      <div className="loading-div" style={{ marginBottom: "10px", height: "40px" }}>
                        <Loader />
                      </div>
                    ) : (
                      <>
                        <div className={`tamanho-print-popup`}>
                          <button
                            className={`tamanho-print-opcao ${selectedTamanhoQrCode === "PP" ? "selected-tamanho-print" : ""}`}
                            onClick={() => setSelectedTamanhoQrCode("PP")}
                          >
                            PP
                          </button>
                          <button
                            className={`tamanho-print-opcao ${selectedTamanhoQrCode === "P" ? "selected-tamanho-print" : ""}`}
                            onClick={() => setSelectedTamanhoQrCode("P")}
                          >
                            P
                          </button>
                          <button
                            className={`tamanho-print-opcao ${selectedTamanhoQrCode === "M" ? "selected-tamanho-print" : ""}`}
                            onClick={() => setSelectedTamanhoQrCode("M")}
                          >
                            M
                          </button>
                          <button
                            className={`tamanho-print-opcao ${selectedTamanhoQrCode === "G" ? "selected-tamanho-print" : ""}`}
                            onClick={() => setSelectedTamanhoQrCode("G")}
                          >
                            G
                          </button>
                        </div>
                        <button onClick={() => printQrCode(ativo)} type="button" className="print-button">
                          <i className="bi bi-printer print-qr-code-icon" />
                        </button>
                      </>
                    )}
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
