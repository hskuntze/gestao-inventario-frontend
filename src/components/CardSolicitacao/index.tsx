import "./styles.css";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";

import Loader from "../Loader";

import { SolicitacaoType } from "@/types/solicitacao";

import { requestBackend } from "@/utils/requests";
import { formatarData, formatarDataParaDiaMesAno } from "@/utils/functions";
import { useClickOutside } from "@/utils/hooks/useClickOutside";

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

type FormData = {
  motivoReprovado: string;
};

interface Props {
  solicitacao: SolicitacaoType;
  onUpdate: (updated: SolicitacaoType) => void; // Atualiza somente a solicitação em questão, sem necessidade de recarregar todos os elementos.
}

function formatarDoisPrimeirosNomes(nome: string): string {
  if (!nome) return "";

  return nome
    .trim()
    .split(/\s+/) // separa por 1 ou mais espaços
    .slice(0, 2) // pega os dois primeiros nomes
    .map((n) => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase())
    .join(" ");
}

const CardSolicitacao = ({ solicitacao, onUpdate }: Props) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [collapseReproval, setCollapseReproval] = useState<boolean>(false);

  const [dropActions, setDropActions] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [solicitacaoVigente, setSolicitacaoVigente] = useState<boolean>(false);

  const handleCloseDropdown = useCallback(() => {
    setDropActions(false);
  }, []);

  useClickOutside(dropdownRef, handleCloseDropdown);

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<FormData>();

  const collapseReprovalSection = () => {
    setCollapseReproval(!collapseReproval);
  };

  /**
   * Verifica se a solicitação está vigente baseado na data de início e fim do período de solicitação.
   * Para estar vigente, a solicitação precisa constar como 'APROVADA' ou 'PENDENTE'.
   *
   * Se não houver data de fim = vigente;
   * Se a data de fim superar a data de hoje = não está vigente (expirou).
   */
  useEffect(() => {
    const { dataFim, status } = solicitacao;

    if (status === "DESISTENCIA") {
      setSolicitacaoVigente(false);
      return;
    }

    if (status !== "APROVADA" && status !== "PENDENTE") {
      setSolicitacaoVigente(false);
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const fim = dataFim ? parseLocalDate(dataFim) : null;

    let vigente = true;

    if (fim && hoje > fim) {
      vigente = false;
    }

    setSolicitacaoVigente(vigente);
  }, [solicitacao]);

  /**
   * Aprovação da solicitação
   */
  const handleApproval = () => {
    if (!window.confirm("Deseja aprovar esta solicitação?")) return;

    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: `/solicitacoes/aprovar/${solicitacao.id}`,
      method: "POST",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success("Solicitação aprovada.");
        onUpdate(res.data);
      })
      .catch((err) => {
        const errorMsg = (err as Error).message || "Erro desconhecido ao tentar aprovar a solicitação";
        toast.error(errorMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  /**
   * Cancelamento da solicitação
   */
  const handleCancel = () => {
    let confirm = window.confirm("Deseja cancelar esta solicitação?");

    if (confirm) {
      const requestParams: AxiosRequestConfig = {
        url: `/solicitacoes/cancelar/${solicitacao.id}`,
        method: "POST",
        withCredentials: true,
      };

      requestBackend(requestParams)
        .then((res) => {
          toast.success("Solicitação cancelada.");
          onUpdate(res.data);
        })
        .catch((err) => {
          const errorMsg = (err as Error).message || "Erro desconhecido ao tentar cancelar a solicitação";
          toast.error(errorMsg);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  /**
   * Desistência da solicitação
   */
  const handleWaiver = () => {
    if (!solicitacaoVigente) return;

    let confirm = window.confirm("Deseja realizar a desistência desta solicitação?");

    if (!confirm) return;

    const requestParams: AxiosRequestConfig = {
      url: `/solicitacoes/desistir/${solicitacao.id}`,
      method: "POST",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success("Desistência confirmada.");
        onUpdate(res.data);
      })
      .catch((err) => {
        const errorMsg = (err as Error).message || "Erro desconhecido ao tentar realizar a desistência da solicitação";
        toast.error(errorMsg);
      });
  };

  /**
   * Finaliza a solicitação
   */
  const handleConclude = () => {
    if (solicitacao.status !== "APROVADA") return;

    let confirm = window.confirm("Deseja finalizar esta solicitação?");

    if (!confirm) return;

    const requestParams: AxiosRequestConfig = {
      url: `/solicitacoes/finalizar/${solicitacao.id}`,
      method: "POST",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success("Sucesso ao finalizar a solicitação");
        onUpdate(res.data);
      })
      .catch((err) => {
        const errorMsg = (err as Error).message || "Erro desconhecido ao tentar finalizar a solicitação";
        toast.error(errorMsg);
      });
  };

  /**
   * Realiza a recusa da solicitação enviando o motivo da recusa
   */
  const onSubmit = (formData: FormData) => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: `/solicitacoes/recusar/${solicitacao.id}`,
      method: "POST",
      withCredentials: true,
      params: {
        motivoRecusa: formData.motivoReprovado,
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success("Solicitação reprovada.");
        onUpdate(res.data);
        collapseReprovalSection();
      })
      .catch((err) => {
        const errorMsg = (err as Error).message || "Erro desconhecido ao tentar reprovar a solicitação";
        toast.error(errorMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDownloadTermoCautela = () => {
    if (!solicitacao.termoCautela) return;

    const requestParams: AxiosRequestConfig = {
      url: `/arquivos/download/${solicitacao.termoCautela.id}`,
      method: "GET",
      withCredentials: true,
      responseType: "blob",
    };

    requestBackend(requestParams)
      .then((res) => {
        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "termo-cautela-" + solicitacao.ativo.idPatrimonial + ".pdf"; // pode usar nome do backend
        document.body.appendChild(link);

        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        toast.error("Erro ao baixar o termo de cautela.");
      });
  };

  return (
    <div className="card-solicitacao-container">
      <div className="card-solicitacao-data">
        <div className="card-solicitacao-person">
          <div className="person-outline">
            <i className="bi bi-person-fill" />
          </div>
          <div className="person-data">
            <span className="person-name">{formatarDoisPrimeirosNomes(solicitacao.usuarioResponsavel.nome)}</span>
            <span className="person-area">{solicitacao.usuarioResponsavel.area.sigla}</span>
          </div>
        </div>
        <div className="card-solicitacao-info">
          <div className="ativo-nome">
            <span className="icone">
              <i className="bi bi-diagram-2" />
            </span>
            <span className="ativo">{solicitacao.ativo.descricao}</span>
          </div>
          <span className="motivo">{solicitacao.motivoSolicitacao}</span>
          <span className="periodo">
            De {formatarData(solicitacao.dataInicio)} até {formatarData(solicitacao.dataFim)}
          </span>
        </div>
        <div className="card-solicitacao-actions">
          <div className="return-element-info">
            <button
              className="return-element-button"
              style={{ display: solicitacao.status === "APROVADA" ? "" : "none" }}
              onClick={handleConclude}
              title="Finalizar solicitação/dar baixa"
            >
              <i className="bi bi-unlock" />
            </button>
          </div>
          <div className="file-info">
            <button
              className="file-button"
              disabled={solicitacao.termoCautela === null ? true : false}
              style={{ display: solicitacao.termoCautela === null ? "none" : "" }}
              onClick={handleDownloadTermoCautela}
            >
              <i className="bi bi-filetype-pdf" />
            </button>
          </div>
          <div className="actions-info">
            <div className="data-info">
              <span className="icone">
                <i className="bi bi-calendar" />
              </span>
              <span className="data">{formatarDataParaDiaMesAno(solicitacao.dataSolicitacao)}</span>
            </div>
            <div className={`status ${solicitacao.status.toLowerCase()}`}>
              <div className="icone">
                <i className="bi bi-circle-fill" />
              </div>
              <span>{solicitacao.status}</span>
            </div>
          </div>
          {!collapseReproval &&
            (loading ? (
              <div className="loading-div">
                <Loader />
              </div>
            ) : (
              <div className="actions-buttons">
                <button
                  type="button"
                  onClick={() => handleApproval()}
                  className={`aprovar-button ${solicitacao.status !== "PENDENTE" ? "desabilitado" : ""}`}
                  disabled={solicitacao.status !== "PENDENTE"}
                >
                  <span>Aprovar</span>
                </button>
                <button
                  type="button"
                  onClick={() => collapseReprovalSection()}
                  className={`reprovar-button ${solicitacao.status !== "PENDENTE" ? "desabilitado" : ""}`}
                  disabled={solicitacao.status !== "PENDENTE"}
                >
                  <span>Reprovar</span>
                </button>
                <div className="solicitacao-actions-dropdown-button" ref={dropdownRef} onClick={() => setDropActions((prev) => !prev)}>
                  <div className="dropdown-trigger">Outras Ações</div>

                  {dropActions && (
                    <div className="dropdown-menu">
                      <button
                        type="button"
                        onClick={() => handleWaiver()}
                        className={`desistir-button ${solicitacaoVigente ? "" : "desabilitado"}`}
                        disabled={!solicitacaoVigente}
                      >
                        Desistência
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel()}
                        className={`cancelar-button ${solicitacao.status !== "PENDENTE" ? "desabilitado" : ""}`}
                        disabled={solicitacao.status !== "PENDENTE"}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
      {collapseReproval && (
        <div className="card-solicitacao-reproval-section">
          <div className="reproval-content">
            <form className="reproval-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="div-input-formulario">
                <div className="div-input-header">
                  <i className="bi bi-exclamation-octagon-fill" />
                  <span>Motivo da Reprovação</span>
                  <span className="obrigatorio-ast">*</span>
                </div>
                <textarea
                  id="motivo-reprovado"
                  className={`input-formulario input-textarea-formulario ${errors.motivoReprovado ? "input-error" : ""}`}
                  {...register("motivoReprovado", { required: "Campo obrigatório" })}
                  maxLength={255}
                  style={{ paddingTop: 5 }}
                ></textarea>
                <div className="invalid-feedback d-block div-erro">{errors.motivoReprovado?.message}</div>
              </div>
              <div className="form-bottom">
                <div className="legenda">* Campos obrigatórios</div>
                {loading ? (
                  <div className="loading-div">
                    <Loader />
                  </div>
                ) : (
                  <div className="form-buttons">
                    <button className="button submit-button">Confirmar Reprovação</button>
                    <button className="button voltar-button" onClick={() => collapseReprovalSection()}>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardSolicitacao;
