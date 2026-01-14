import "./styles.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { AtivoType } from "@/types/ativo";
import { useCallback, useEffect, useState } from "react";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import Loader from "@/components/Loader";

type FormData = {
  ativo: AtivoType;
  motivoSolicitacao: string;
  dataInicio: string;
  dataFim: string;
};

type UrlParams = {
  id: string;
};

const SolicitacoesForm = () => {
  const urlParams = useParams<UrlParams>();
  const isEditing = urlParams.id === "create" ? false : true;

  const [loading, setLoading] = useState<boolean>(false);
  const [ativos, setAtivos] = useState<AtivoType[]>([]);

  const [showMensagemSucesso, setShowMensagemSucesso] = useState<boolean>(true);

  const navigate = useNavigate();

  const {
    handleSubmit,
    formState: { errors },
    control,
    register,
  } = useForm<FormData>();

  const loadAtivos = useCallback(() => {
    const requestParams: AxiosRequestConfig = {
      url: "/ativos/all",
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
      })
      .catch((err) => {})
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAtivos();
    setShowMensagemSucesso(false);
  }, [loadAtivos]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="header-content">
          <h2>Solicitação de Ativo</h2>
          <div className="header-content-buttons">
            <Link to="/gestao-inventario/solicitacoes" type="button" className="voltar-button">
              Voltar
            </Link>
          </div>
        </div>
      </div>
      <div className="page-content">
        {showMensagemSucesso ? (
          <div className="cadastro-solicitacao-sucesso">
            <span className="mensagem-cadastro-sucesso">Solicitação cadastrada com sucesso. Aguarde a avaliação.</span>
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
          <div className="content-container bg-card-container w-100">
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
                    <select
                      id="ativo"
                      className={`input-formulario ${errors.ativo ? "input-error" : ""}`}
                      {...field}
                      value={field.value?.id || ""}
                      onChange={(e) => {
                        const selectedId = Number(e.target.value);
                        const ativoSelecionado = ativos.find((a) => a.id === selectedId) || null;

                        if (ativoSelecionado !== null) {
                          field.onChange(ativoSelecionado);
                        }
                      }}
                    >
                      <option value="">Selecione um ativo</option>
                      {ativos &&
                        ativos.length > 0 &&
                        ativos
                          .filter((a) => a.usuarioResponsavel === null)
                          .filter((a) => a.passivelEmprestimo === true)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.descricao} - {a.idPatrimonial}
                            </option>
                          ))}
                    </select>
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
                <input type="date" className={`input-formulario data-input ${errors.dataFim ? "input-error" : ""}`} {...register("dataFim")} />
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
                    <button className={`button submit-button ${isEditing ? "disabled-field" : ""}`} disabled={isEditing}>
                      Salvar
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SolicitacoesForm;
