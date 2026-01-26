import "./styles.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Controller, useForm, useWatch } from "react-hook-form";
import { AtivoType } from "@/types/ativo";
import { useCallback, useEffect, useState } from "react";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import Loader from "@/components/Loader";
import { SolicitacaoType } from "@/types/solicitacao";
import { Autocomplete, TextField } from "@mui/material";

type FormData = {
  ativo: AtivoType;
  motivoSolicitacao: string;
  dataInicio: string;
  dataFim: string;
};

type UrlParams = {
  id: string;
};

const iconeAtivo: { [key: string]: string } = {
  ACESSORIO: "bi bi-easel",
  ELETRONICO: "bi bi-phone",
  EPI: "bi bi-person-walking",
  INFORMATICA: "bi bi-pc-display-horizontal",
  MOBILIARIO: "bi bi-building",
  SOFTWARE: "bi bi-terminal",
};

const SolicitacoesForm = () => {
  const urlParams = useParams<UrlParams>();
  const isEditing = urlParams.id === "create" ? false : true;

  const [loading, setLoading] = useState<boolean>(false);
  const [ativos, setAtivos] = useState<AtivoType[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoType[]>([]);

  const [ativoSelecionado, setAtivoSelecionado] = useState<AtivoType | null>(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);

  const [showMensagemSucesso, setShowMensagemSucesso] = useState<boolean>(true);

  const navigate = useNavigate();

  const {
    handleSubmit,
    formState: { errors },
    control,
    register,
  } = useForm<FormData>();

  const dataInicio = useWatch({
    control,
    name: "dataInicio",
  });

  const verificarDisponibilidade = (ativo: AtivoType): boolean => {
    return !solicitacoes.some(
      (solicitacao) => solicitacao.ativo.id === ativo.id && (solicitacao.status === "PENDENTE" || solicitacao.status === "APROVADO"),
    );
  };

  const loadAtivos = useCallback(() => {
    const requestParams: AxiosRequestConfig = {
      url: "/ativos/passiveis/emprestimo",
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        setAtivos(res.data as AtivoType[]);
      })
      .catch((err) => {
        const errorMsg = (err as Error).message || "Erro desconhecido ao tentar carregar os ativos para o formulário de solicitação.";
        toast.error(errorMsg);
      });
  }, []);

  const loadSolicitacoes = useCallback(() => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/solicitacoes/all",
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        setSolicitacoes(res.data as SolicitacaoType[]);
      })
      .catch((err) => {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar as solicitações";
        toast.error(errorMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const onSubmit = (formData: FormData) => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/solicitacoes/register",
      method: "POST",
      withCredentials: true,
      data: {
        motivoSolicitacao: formData.motivoSolicitacao,
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim === "" ? null : formData.dataFim,
        idAtivo: formData.ativo.id,
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success("Solicitação cadastrada.");
        setShowMensagemSucesso(true);
        setMostrarPreview(false);
      })
      .catch((err) => {})
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAtivos();
    loadSolicitacoes();
    setShowMensagemSucesso(false);
  }, [loadAtivos, loadSolicitacoes]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="header-content">
          <h2>Empréstimo de Ativo</h2>
          <div className="header-content-buttons">
            <Link to="/gestao-inventario/solicitacoes" type="button" className="voltar-button">
              Voltar
            </Link>
          </div>
        </div>
      </div>
      <div className="page-solicitacao-main">
        <div className="page-content">
          {showMensagemSucesso ? (
            <div className="cadastro-solicitacao-sucesso">
              <span className="mensagem-cadastro-sucesso">Solicitação de empréstimo cadastrada com sucesso. Aguarde a avaliação.</span>
              <span className="mensagem-info-sucesso">Deseja realizar outra solicitação?</span>
              <div className="botoes-cadastro-sucesso">
                <button type="button" className="button general-button pd-2" onClick={() => navigate("/gestao-inventario")}>
                  Página inicial
                </button>
                <button type="button" className="button submit-button pd-2" onClick={() => navigate(0)}>
                  Sim
                </button>
              </div>
            </div>
          ) : (
            <div className="content-container bg-card-container solicitacao-form-container">
              <span className="form-title">Informações da Solicitação</span>
              <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
                <div className="div-input-formulario w-100">
                  <div>
                    <span>Ativo</span>
                    <span className="obrigatorio-ast">*</span>
                  </div>
                  <Controller
                    name="ativo"
                    control={control}
                    rules={{ required: "Campo obrigatório" }}
                    render={({ field }) => (
                      <Autocomplete
                        options={ativos.filter((a) => a.passivelEmprestimo)}
                        getOptionLabel={(option) => `${option.descricao} - ${option.idPatrimonial}`}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={field.value || null}
                        onChange={(_, newValue) => {
                          field.onChange(newValue);

                          if (newValue) {
                            setAtivoSelecionado(newValue);
                            setMostrarPreview(true);
                          } else {
                            setMostrarPreview(false);
                            setAtivoSelecionado(null);
                          }
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            padding: 0,
                            border: "none",
                            minHeight: "50px",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            border: "none",
                          },
                          "& .MuiInputBase-input": {
                            color: "#fff",
                            borderRadius: "10px",
                            border: 0,
                            fontSize: "14px",
                            fontFamily: "Inter, sans-serif",
                            minHeight: "50px",
                          },
                        }}
                        classes={{
                          root: `input-formulario ${errors.ativo ? "input-error" : ""}`,
                        }}
                        renderInput={(params) => <TextField {...params} />}
                      />
                    )}
                  />
                  <div className="invalid-feedback d-block div-erro">{errors.ativo?.message}</div>
                </div>
                <div className="div-input-formulario text-area-formulario">
                  <div>
                    <span>Motivo da Solicitação</span>
                    <span className="obrigatorio-ast">*</span>
                  </div>
                  <textarea
                    id="motivo-solicitacao"
                    className={`input-formulario ${errors.motivoSolicitacao ? "input-error" : ""}`}
                    rows={4}
                    {...register("motivoSolicitacao", {
                      required: "Campo obrigatório",
                    })}
                    maxLength={255}
                  ></textarea>
                  <div className="invalid-feedback d-block div-erro">{errors.motivoSolicitacao?.message}</div>
                </div>
                <div className="div-input-formulario">
                  <div>
                    <span>Data início</span>
                    <span className="obrigatorio-ast">*</span>
                  </div>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className={`input-formulario data-input ${errors.dataInicio ? "input-error" : ""}`}
                    {...register("dataInicio", { required: "Campo obrigatório" })}
                  />
                  <div className="invalid-feedback d-block div-erro">{errors.dataInicio?.message}</div>
                </div>
                <div className="div-input-formulario">
                  <div>
                    <span>Data fim</span>
                  </div>
                  <input
                    type="date"
                    className={`input-formulario data-input ${errors.dataFim ? "input-error" : ""}`}
                    {...register("dataFim", {
                      validate: (dataFim) => {
                        if (!dataFim || !dataInicio) return true;

                        return dataFim >= dataInicio || "Data fim não pode ser anterior à data início";
                      },
                    })}
                  />
                  <div className="invalid-feedback d-block div-erro">{errors.dataFim?.message}</div>
                </div>
                {loading ? (
                  <div className="loading-div" style={{ marginTop: "20px", marginBottom: "10px" }}>
                    <Loader />
                  </div>
                ) : (
                  <div className="form-bottom">
                    <div className="legenda">* Campos obrigatórios</div>
                    <div className="form-buttons">
                      <button className={`button submit-button pd-2 ${isEditing ? "disabled-field" : ""}`} disabled={isEditing}>
                        <i className="bi bi-send-fill" /> Solicitar
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
        <div className={`page-side ${mostrarPreview ? "show" : ""}`}>
          <div className="solicitacao-ativo-pre-visualizacao">
            <div className="pre-vis-header">
              <i className={`${iconeAtivo[ativoSelecionado ? ativoSelecionado.categoria : "DEFAULT"]}`}></i>
            </div>
            <div className="pre-vis-body">
              <span className="pre-vis-subtitle">pré-visualização do ativo</span>
              <span className="pre-vis-body-title">{ativoSelecionado?.descricao}</span>
              <div className="pre-vis-info-cards">
                <div className="pre-vis-info-card">
                  <span className="pre-vis-title">categoria</span>
                  <span className="pre-vis-value">{ativoSelecionado?.categoria}</span>
                </div>
                <div className="pre-vis-info-card">
                  <span className="pre-vis-title">id patrimonial</span>
                  <span className="pre-vis-value">{ativoSelecionado?.idPatrimonial}</span>
                </div>
              </div>
              <div
                className={`pre-vis-tag ${
                  ativoSelecionado ? (verificarDisponibilidade(ativoSelecionado) ? "disponivel" : "pendente") : "indisponivel"
                }`}
              >
                <span>{ativoSelecionado ? (verificarDisponibilidade(ativoSelecionado) ? "Disponível" : "Pendente") : "Indisponível"}</span>
              </div>
            </div>
          </div>
          <div className="aviso-solicitacao">
            <div className="aviso-solicitacao-icone">
              <i className="bi bi-info-circle-fill" />
            </div>
            <div className="aviso-solicitacao-conteudo">
              <span className="aviso-solicitacao-titulo">Aprovação Necessária</span>
              <span className="aviso-solicitacao-corpo">Esta solicitação será enviada para aprovação do seu gestor direto.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolicitacoesForm;
