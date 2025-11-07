import "./styles.css";
import { Controller, useForm } from "react-hook-form";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import UploadArquivos from "@/components/UploadArquivos";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AtivoType } from "@/types/ativo";
import { HistoricoType } from "@/types/historico";
import CardHistoricoAtivo from "@/components/CardHistoricoAtivo";
import { AreaType } from "@/types/area";
import { UsuarioResponsavelType } from "@/types/usuario_responsavel";
import { FornecedorType } from "@/types/fornecedor";
import { fetchAllAreas, fetchAllFornecedores, fetchAllFornecedoresByAreaId, fetchAllUsuariosResponsaveis } from "@/utils/functions";
import { LocalizacaoType } from "@/types/localizacao";
import { Box, Modal } from "@mui/material";
import AtivoFormLoaderSkeleton from "./AtivoFormLoaderSkeleton";

type FormData = {
  tipoAtivo: string | null;
  gerarIdPatrimonial: boolean;

  idPatrimonial: string;
  categoria: string;
  descricao: string;
  area: AreaType;
  localizacao: LocalizacaoType;
  usuarioResponsavel: UsuarioResponsavelType;
  fornecedor: FornecedorType;
  dataAquisicao: string;
  codigoSerie: string;
  observacoes: string;
  linkDocumento: string;
  estadoConservacao: string;
  dataDevolucaoPrevista: string;
  dataDevolucaoRealizada: string;
};

type UrlParams = {
  id: string;
};

const AtivoForm = () => {
  const urlParams = useParams<UrlParams>();
  const isEditing = urlParams.id === "create" ? false : true;

  const [tipoForm, setTipoForm] = useState<"t" | "i" | "tl" | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [ativo, setAtivo] = useState<AtivoType>();
  const [historicoAtivo, setHistoricoAtivo] = useState<HistoricoType[]>();
  const [desabilitado, setDesabilitado] = useState(false);

  const [areas, setAreas] = useState<AreaType[]>([]);
  const [localizacoes, setLocalizacoes] = useState<LocalizacaoType[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorType[]>([]);
  const [usuariosResponsaveis, setUsuariosResponsaveis] = useState<UsuarioResponsavelType[]>([]);

  const [selectedArea, setSelectedArea] = useState<AreaType>();
  const [selectedLocalizacao, setSelectedLocalizacao] = useState<LocalizacaoType>();
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
  } = useForm<FormData>();

  const handleToggleModal = () => {
    setOpenModal(!openModal);
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

  const handleHabilitar = () => {
    const requestParams: AxiosRequestConfig = {
      url: "/ativos/habilitar",
      method: "POST",
      withCredentials: true,
      params: {
        id: urlParams.id,
      },
    };

    requestBackend(requestParams)
      .then(() => {
        toast.success("Ativo foi habilitado.");
        navigate("/gestao-inventario/ativo");
      })
      .catch(() => {
        toast.error("Erro ao tentar habilitar este ativo.");
      });
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
            id: formData.area.id,
          },
          localizacao: {
            id: formData.localizacao.id,
          },
          usuariosResponsavel: {
            id: formData.usuarioResponsavel.id,
          },
        },
      };

      requestBackend(requestParams)
        .then((res) => {
          toast.success(isEditing ? "Sucesso ao atualizar o cadastro do ativo" : "Sucesso ao cadastrar novo ativo");
          navigate("/gestao-inventario/ativo");
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
        console.log(data);

        setAtivo(data);

        setDesabilitado(data.desabilitado);
        setGerarIdPatrimonial(data.gerarIdPatrimonial);

        setValue("tipoAtivo", data.tipoAtivo);
        setTipoForm(data.tipoAtivo as "t" | "i" | "tl");

        setValue("area", data.area);
        setSelectedArea(data.area);

        setValue("localizacao", data.localizacao);
        setSelectedLocalizacao(data.localizacao);

        setValue("categoria", data.categoria);
        setValue("codigoSerie", data.codigoSerie);
        setValue("dataAquisicao", data.dataAquisicao);
        setValue("descricao", data.descricao);
        setValue("estadoConservacao", data.estadoConservacao);
        setValue("fornecedor", data.fornecedor);
        setValue("idPatrimonial", data.idPatrimonial);
        setValue("linkDocumento", data.linkDocumento);
        setValue("observacoes", data.observacoes);
        setValue("usuarioResponsavel", data.usuarioResponsavel);
        setValue("gerarIdPatrimonial", data.gerarIdPatrimonial);

        setValue("dataDevolucaoPrevista", data.dataDevolucaoPrevista ?? "");
        setValue("dataDevolucaoRealizada", data.dataDevolucaoRealizada ?? "");
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
    async function getAreas() {
      //setLoadingAreas(true);
      setAreas([]);

      try {
        const data = (await fetchAllAreas()) as AreaType[];
        setAreas(data);
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar áreas";
        toast.error(errorMsg);
      }
    }

    getAreas();
  }, []);

  useEffect(() => {
    async function getFornecedores() {
      //setLoadingFornecedores(true);
      setFornecedores([]);

      try {
        const data = await fetchAllFornecedores();
        setFornecedores(data);
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar fornecedores";
        toast.error(errorMsg);
      }
    }

    getFornecedores();
  }, []);

  useEffect(() => {
    async function getLocalizacoes() {
      //setLoadingLocalizacoes(true);
      setLocalizacoes([]);

      try {
        if (selectedArea) {
          const data = await fetchAllFornecedoresByAreaId(selectedArea.id);
          setLocalizacoes(data);
        }
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar localizações";
        toast.error(errorMsg);
      }
    }

    getLocalizacoes();
  }, [selectedArea]);

  useEffect(() => {
    async function getUsuariosResponsaveis() {
      //setLoadingUsuariosResponsaveis(true);
      setUsuariosResponsaveis([]);

      try {
        const data = await fetchAllUsuariosResponsaveis();
        setUsuariosResponsaveis(data);
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar usuários responsáveis";
        toast.error(errorMsg);
      }
    }

    getUsuariosResponsaveis();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (acoesDropdownRef.current && !acoesDropdownRef.current.contains(event.target as Node)) {
        setOpenAcoes(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
                <button type="button" className="acoes-toggle" onClick={() => setOpenAcoes(!openAcoes)}>
                  Ações <i className="bi bi-chevron-down" />
                </button>

                {openAcoes && (
                  <div className="acoes-menu">
                    <button type="button" disabled={desabilitado} className="movimentacao-button" onClick={handleToggleModal}>
                      Movimentar
                    </button>
                    {ativo?.desabilitado ? (
                      <button type="button" className="habilitar-button" onClick={handleHabilitar}>
                        Habilitar
                      </button>
                    ) : (
                      <button type="button" className="desabilitar-button" onClick={handleDesabilitar}>
                        Desabilitar
                      </button>
                    )}
                  </div>
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
              <span>Área</span>
              <Controller
                name="area"
                control={control}
                rules={{
                  required: "Campo obrigatório",
                }}
                render={({ field }) => (
                  <select
                    id="area"
                    className={`input-formulario ${errors.area ? "input-error" : ""}`}
                    {...field}
                    value={field.value?.id || ""}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const selectedArea = areas.find((a) => a.id === selectedId) as AreaType;

                      field.onChange(selectedArea || null);
                      setSelectedArea(selectedArea);
                      setLocalizacoes(selectedArea ? selectedArea.localizacoes : []);
                    }}
                  >
                    <option value="">Selecione uma área</option>
                    {areas &&
                      areas.length > 0 &&
                      areas.map((a) => (
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
              <input type="text" className={`input-formulario disabled-field`} disabled={true} value={selectedArea?.responsavel} />
            </div>
            <div className="div-input-formulario">
              <span>Localização</span>
              <Controller
                name="localizacao"
                control={control}
                rules={{
                  required: "Campo obrigatório",
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
              <div className="invalid-feedback d-block div-erro">{errors.area?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>Usuário responsável</span>
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
            <div className="form-buttons">
              <button className="button submit-button">Salvar</button>
            </div>
          </form>
        </Box>
      </Modal>
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
                  <div className="content-container">
                    <span className="form-title">Informações do Ativo</span>
                    <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
                      <div className="div-input-formulario text-area-formulario">
                        <span>Descrição</span>
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
                          <span>ID Patrimonial</span>
                          <input
                            type="text"
                            className={`input-formulario ${gerarIdPatrimonial || desabilitado ? "disabled-field" : ""}`}
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
                        <span>Categoria</span>
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
                        <span>Área</span>
                        <Controller
                          name="area"
                          control={control}
                          rules={{
                            required: "Campo obrigatório",
                          }}
                          render={({ field }) => (
                            <select
                              id="area"
                              className={`input-formulario ${errors.area ? "input-error" : ""} ${!isEditing ? "" : "disabled-field"}`}
                              {...field}
                              value={field.value?.id || ""}
                              onChange={(e) => {
                                const selectedId = Number(e.target.value);
                                const selectedArea = areas.find((a) => a.id === selectedId) as AreaType;

                                field.onChange(selectedArea || null);
                                setSelectedArea(selectedArea);
                                setLocalizacoes(selectedArea ? selectedArea.localizacoes : []);
                              }}
                              disabled={!isEditing ? false : true}
                            >
                              <option value="">Selecione uma área</option>
                              {areas &&
                                areas.length > 0 &&
                                areas.map((a) => (
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
                        <input type="text" className={`input-formulario disabled-field`} disabled={true} value={selectedArea?.responsavel} />
                      </div>
                      <div className="div-input-formulario">
                        <span>Localização</span>
                        <Controller
                          name="localizacao"
                          control={control}
                          rules={{
                            required: "Campo obrigatório",
                          }}
                          render={({ field }) => (
                            <select
                              id="localizacao"
                              className={`input-formulario ${errors.localizacao ? "input-error" : ""} ${
                                (localizacoes !== undefined || selectedLocalizacao !== undefined) && !isEditing ? "" : "disabled-field"
                              }`}
                              {...field}
                              value={field.value?.id || ""}
                              onChange={(e) => {
                                const selectedId = Number(e.target.value);
                                const selectedLocalizacao = localizacoes.find((a) => a.id === selectedId);

                                field.onChange(selectedLocalizacao || null);
                                setSelectedLocalizacao(selectedLocalizacao);
                              }}
                              disabled={(localizacoes !== undefined || selectedLocalizacao !== undefined) && !isEditing ? false : true}
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
                        <span>Usuário responsável</span>
                        <Controller
                          name="usuarioResponsavel"
                          control={control}
                          rules={{
                            required: "Campo obrigatório",
                          }}
                          render={({ field }) => (
                            <select
                              id="usuarioResponsavel"
                              className={`input-formulario ${errors.usuarioResponsavel ? "input-error" : ""} ${!isEditing ? "" : "disabled-field"}`}
                              {...field}
                              value={field.value?.id || ""}
                              onChange={(e) => {
                                const selectedId = Number(e.target.value);
                                const selectedUsuarioResponsavel = usuariosResponsaveis.find((a) => a.id === selectedId);

                                field.onChange(selectedUsuarioResponsavel || null);
                              }}
                              disabled={!isEditing ? false : true}
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
                        <span>Fornecedor</span>
                        <Controller
                          name="fornecedor"
                          control={control}
                          rules={{
                            required: "Campo obrigatório",
                          }}
                          render={({ field }) => (
                            <select
                              id="fornecedor"
                              className={`input-formulario ${errors.fornecedor ? "input-error" : ""} ${desabilitado ? "disabled-field" : ""}`}
                              {...field}
                              value={field.value?.id || ""}
                              onChange={(e) => {
                                const selectedId = Number(e.target.value);
                                const selectedFornecedor = fornecedores.find((a) => a.id === selectedId);

                                field.onChange(selectedFornecedor || null);
                              }}
                              disabled={desabilitado}
                            >
                              <option value="">Selecione um fornecedor</option>
                              {fornecedores &&
                                fornecedores.length > 0 &&
                                fornecedores.map((a) => (
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
                        <span>Data aquisição</span>
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
                            <span>Data de devolução prevista</span>
                            <input
                              type="date"
                              className={`input-formulario data-input ${errors.dataDevolucaoPrevista ? "input-error" : ""} ${
                                desabilitado ? "disabled-field" : ""
                              }`}
                              {...register("dataDevolucaoPrevista", { required: "Campo obrigatório" })}
                              disabled={desabilitado}
                            />
                            <div className="invalid-feedback d-block div-erro">{errors.dataDevolucaoPrevista?.message}</div>
                          </div>
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
                          </div>
                        </>
                      )}
                      {tipoForm !== "i" && (
                        <div className="div-input-formulario">
                          <span>Estado de conservação</span>
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
                        <span>Código de série</span>
                        <input
                          type="text"
                          className={`input-formulario ${errors.codigoSerie ? "input-error" : ""} ${desabilitado ? "disabled-field" : ""}`}
                          {...register("codigoSerie", { required: "Campo obrigatório" })}
                          maxLength={255}
                          disabled={desabilitado}
                        />
                        <div className="invalid-feedback d-block div-erro">{errors.codigoSerie?.message}</div>
                      </div>
                      <div className={`div-input-formulario ${tipoForm !== "i" ? "input-full-width" : ""}`}>
                        <span>Link do documento</span>
                        <input
                          type="text"
                          className={`input-formulario ${desabilitado ? "disabled-field" : ""}`}
                          {...register("linkDocumento")}
                          maxLength={255}
                          disabled={desabilitado}
                        />
                      </div>
                      <div className="div-input-formulario text-area-formulario">
                        <span>Observações</span>
                        <textarea
                          id="observacoes"
                          className={`input-formulario ${desabilitado ? "disabled-field" : ""}`}
                          rows={4}
                          {...register("observacoes")}
                          maxLength={255}
                          disabled={desabilitado}
                        ></textarea>
                      </div>
                      <div className="form-buttons">
                        <button className={`button submit-button ${desabilitado ? "disabled-field" : ""}`} disabled={desabilitado}>
                          Salvar
                        </button>
                      </div>
                    </form>
                  </div>
                  {isEditing && (
                    <div className="content-container">
                      <span className="form-title">Anexos</span>
                      {ativo ? (
                        <UploadArquivos
                          tipoAtivo={tipoForm}
                          idAtivo={String(ativo.id)}
                          defaultFiles={ativo?.imagens}
                          ativoDesabilitado={desabilitado}
                        />
                      ) : (
                        <UploadArquivos tipoAtivo={tipoForm} ativoDesabilitado={desabilitado} />
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
