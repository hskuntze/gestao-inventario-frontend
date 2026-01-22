import { useCallback, useEffect, useMemo, useState } from "react";
import "./styles.css";
import { AuditoriaType } from "@/types/auditoria";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import CardAuditoriaAtivo from "@/components/CardAuditoriaAtivo";
import {
  calcularPercentualConferencia,
  calcularQuantidadeConferidos,
  fetchAllLocalizacoesByAreaId,
  fetchAllSetores,
  fetchAllUsuariosResponsaveis,
} from "@/utils/functions";
import { SetorType } from "@/types/area";
import { LocalizacaoType } from "@/types/localizacao";
import { UsuarioResponsavelType } from "@/types/usuario_responsavel";
import Loader from "@/components/Loader";
import { TablePagination } from "@mui/material";
import { SyncLoader } from "react-spinners";

type StatusType = "PENDENTE" | "CONFERIDO" | "NAO_LOCALIZADO" | "DIVERGENTE" | "SOB_MANUTENCAO";

const AuditoriaList = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingNewCampaing, setLoadingNewCampaing] = useState<boolean>(false);
  const [auditorias, setAuditorias] = useState<AuditoriaType[]>([]);
  const [auditoriaSelecionada, setAuditoriaSelecionada] = useState<AuditoriaType | null>(null);

  const [setores, setSetores] = useState<SetorType[]>([]);
  const [localizacoes, setLocalizacoes] = useState<LocalizacaoType[]>([]);
  const [usuariosResponsaveis, setUsuariosResponsaveis] = useState<UsuarioResponsavelType[]>([]);

  const [selectedSetor, setSelectedSetor] = useState<SetorType | null>(null);
  const [selectedLocalizacao, setSelectedLocalizacao] = useState<LocalizacaoType | null>(null);
  const [selectedUsuarioResponsavel, setSelectedUsuarioResponsavel] = useState<UsuarioResponsavelType | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusType | null>(null);

  const [filter, setFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);

  const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, pageNumber: number) => {
    setPage(pageNumber);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value.toLowerCase());
    setPage(0);
  };

  const handleClearFilters = () => {
    setSelectedLocalizacao(null);
    setSelectedSetor(null);
    setSelectedUsuarioResponsavel(null);
    setSelectedStatus(null);
    setFilter("");
  };

  const totalAtivosQuadrimestre = () => {
    if (auditoriaSelecionada) {
      return auditoriaSelecionada.ativos.length;
    } else {
      return 0;
    }
  };

  const loadAuditorias = useCallback(() => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/auditoria/all",
      withCredentials: true,
      method: "GET",
    };

    requestBackend(requestParams)
      .then((res) => {
        setAuditorias(res.data as AuditoriaType[]);
      })
      .catch((err) => {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar auditorias";
        toast.error(errorMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadAuditorias();
  }, [loadAuditorias]);

  const auditoriasPorAno = auditorias.reduce<Record<number, AuditoriaType[]>>((acc, auditoria) => {
    if (!acc[auditoria.ano]) {
      acc[auditoria.ano] = [];
    }

    acc[auditoria.ano].push(auditoria);
    return acc;
  }, {});

  const anosOrdenados = Object.keys(auditoriasPorAno)
    .map(Number)
    .sort((a, b) => b - a);

  const ativos = auditoriaSelecionada?.ativos ?? [];

  const filteredData = ativos.filter((a) => {
    const searchTerm = filter.trim().toLowerCase();

    // 🔍 Filtro por texto
    const matchesSearch =
      !searchTerm ||
      a.nomeAtivo.toLowerCase().includes(searchTerm) ||
      a.status.toLowerCase().includes(searchTerm) ||
      a.idPatrimonioAtivo.toLowerCase().includes(searchTerm) ||
      a.localizacaoAtivo.toLowerCase().includes(searchTerm) ||
      a.usuarioResponsavelAtivo.toLowerCase().includes(searchTerm);

    const matchesUsuarioResponsavel = !selectedUsuarioResponsavel || a.usuarioResponsavelAtivo === selectedUsuarioResponsavel.nome;

    const matchesStatus = !selectedStatus || a.status === selectedStatus;

    const matchesSetor = !selectedSetor || a.setorAtivo === selectedSetor.nome;

    const matchesLocalizacao = !selectedLocalizacao || a.localizacaoAtivo === selectedLocalizacao.nome;

    return matchesSearch && matchesUsuarioResponsavel && matchesStatus && matchesSetor && matchesLocalizacao;
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const percentual = useMemo(() => {
    if (auditoriaSelecionada) {
      return calcularPercentualConferencia(auditoriaSelecionada.ativos);
    } else {
      return 0;
    }
  }, [auditoriaSelecionada]);

  const handleNewCampaing = () => {
    setLoadingNewCampaing(true);

    const requestParams: AxiosRequestConfig = {
      url: "/auditoria/gerar",
      method: "POST",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success("Sucesso ao criar uma nova campanha.");
      })
      .catch((err) => {
        const errorMsg = (err as Error).message || "Erro desconhecido ao tentar criar uma nova campanha de auditoria";
        toast.error(errorMsg);
      })
      .finally(() => {
        setLoadingNewCampaing(false);
      });
  };

  useEffect(() => {
    async function getUsuariosResponsaveis() {
      setUsuariosResponsaveis([]);

      try {
        const data = await fetchAllUsuariosResponsaveis();
        setUsuariosResponsaveis(data.filter((u) => !u.desabilitado));
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar usuários responsáveis";
        toast.error(errorMsg);
      }
    }

    getUsuariosResponsaveis();
  }, []);

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

  return (
    <div className="page page-auditoria">
      <div className="menu-lateral-auditorias">
        {anosOrdenados.map((ano) => (
          <div key={ano} className="menu-lateral-div">
            <span className="auditoria-ano-label">{ano}</span>

            <div className="menu-quadrimestres">
              {auditoriasPorAno[ano].map((auditoria) => (
                <button
                  key={auditoria.id}
                  className={`menu-quadrimestre-item ${auditoriaSelecionada?.id === auditoria.id ? "active" : ""}`}
                  onClick={() => setAuditoriaSelecionada(auditoria)}
                >
                  <i className="bi bi-calendar" /> {ano} - {auditoria.quadrimestre}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="page-auditoria-content">
        <div className="page-header">
          <div className="header-content">
            <h2 className="page-title">
              Auditoria {auditoriaSelecionada ? auditoriaSelecionada.ano + " - " + auditoriaSelecionada.quadrimestre : ""}
            </h2>
            {loadingNewCampaing ? (
              <div className="loader-div" style={{ width: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SyncLoader color="#02b3ff" loading={true} size={10} />
              </div>
            ) : (
              <button className="nova-campanha-auditoria" type="button" onClick={() => handleNewCampaing()}>
                <i className="bi bi-plus-circle-dotted" />
                Nova campanha de auditoria
              </button>
            )}
          </div>
          <span className="page-subtitle">Confira todos os processos de auditoria</span>
        </div>
        <div className="card-progresso-auditoria">
          <div className="cp-header">
            <div className="cp-header-left">
              <i className="bi bi-clipboard-data-fill" />
              <span>Progresso da Auditoria</span>
            </div>
            <span className="cp-header-percentage">{percentual}%</span>
          </div>
          <div className="cp-progress-bar">
            <div className="cp-progress-fill" style={{ width: `${percentual}%` }} />
          </div>
          <div className="cp-footer">
            <span>
              {auditoriaSelecionada ? calcularQuantidadeConferidos(auditoriaSelecionada.ativos) : 0} de {totalAtivosQuadrimestre()} ativos conferidos
            </span>
          </div>
        </div>
        <div className="filtro-auditoria-container">
          <div className="filtro-container" style={{ marginBottom: "10px" }}>
            <div className="filtro-input-div form-floating">
              <i className="bi bi-search" />
              <input
                type="text"
                className="filtro-input"
                id="nome-ativo-filtro"
                placeholder="Digite um termo para filtrar"
                onChange={handleFilterChange}
              />
            </div>
            <div className="filtro-input-div form-floating">
              <i className="bi bi-search" />
              <select
                name="por-status"
                id="por-status"
                className={`filtro-input`}
                onChange={(e) => {
                  let value = e.target.value;

                  setSelectedStatus(value as StatusType);
                  setPage(0);
                }}
                value={selectedStatus ? selectedStatus : ""}
              >
                <option key={"status-no-option"} value="">
                  Selecione um status
                </option>
                <option value="PENDENTE">Pendente</option>
                <option value="CONFERIDO">Conferido</option>
                <option value="NAO_LOCALIZADO">Não Localizado</option>
                <option value="DIVERGENTE">Divergente</option>
                {/* <option value="SOB_MANUTENCAO">Sob Manutenção</option> */}
              </select>
            </div>
            <div className="filtro-input-div form-floating">
              <i className="bi bi-search" />
              <select
                name="por-area"
                id="por-area"
                className={`filtro-input`}
                onChange={(e) => {
                  setPage(0);
                  let value = e.target.value;

                  let setor = setores.find((s) => s.id === Number(value));

                  if (setor) {
                    setSelectedSetor(setor);
                  } else {
                    setSelectedSetor(null);
                  }
                }}
                value={selectedSetor ? selectedSetor.id : ""}
              >
                <option key={"setor-no-option"} value="">
                  Selecione um setor
                </option>
                {setores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="filtro-input-div form-floating">
              <i className="bi bi-search" />
              <select
                name="por-localizacao"
                id="por-localizacao"
                className={`filtro-input ${selectedSetor !== null ? "" : "disabled-field"}`}
                onChange={(e) => {
                  setPage(0);
                  let value = e.target.value;

                  let loc = localizacoes.find((l) => l.id === Number(value));

                  if (loc) {
                    setSelectedLocalizacao(loc);
                  } else {
                    setSelectedLocalizacao(null);
                  }
                }}
                disabled={selectedSetor === null}
                value={selectedLocalizacao ? selectedLocalizacao.id : ""}
              >
                <option key={"localizacao-no-option"} value="">
                  Selecione uma localização
                </option>
                {localizacoes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="filtro-input-div form-floating">
              <i className="bi bi-search" />
              <select
                name="por-usuario-responsavel"
                id="por-usuario-responsavel"
                className={`filtro-input`}
                onChange={(e) => {
                  setPage(0);
                  let value = e.target.value;

                  let ur = usuariosResponsaveis.find((ur) => ur.id === Number(value));

                  if (ur) {
                    setSelectedUsuarioResponsavel(ur);
                  } else {
                    setSelectedUsuarioResponsavel(null);
                  }
                }}
                value={selectedUsuarioResponsavel ? selectedUsuarioResponsavel.id : ""}
              >
                <option key={"usuario-responsavel-no-option"} value="">
                  Selecione um usuário
                </option>
                {usuariosResponsaveis.map((ur) => (
                  <option key={ur.id} value={ur.id}>
                    {ur.nome}
                  </option>
                ))}
              </select>
            </div>
            <button className="button general-button auto-width pd-3" type="button" onClick={handleClearFilters}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>
        <div className="auditoria-conteudo">
          {loading ? (
            <div className="loading-div">
              <Loader />
            </div>
          ) : auditoriaSelecionada ? (
            <div className="lista-ativos">
              {paginatedData.map((ativo) => (
                <CardAuditoriaAtivo key={ativo.id} ativo={ativo} />
              ))}
            </div>
          ) : (
            <div className="no-data-info">Selecione uma auditoria no menu lateral</div>
          )}
          <TablePagination
            className="table-pagination-container"
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 20]}
            labelRowsPerPage="Registros por página: "
            labelDisplayedRows={({ from, to, count }) => {
              return `${from} - ${to} de ${count}`;
            }}
            showFirstButton={true}
            showLastButton={true}
            classes={{
              selectLabel: "pagination-select-label",
              displayedRows: "pagination-displayed-rows-label",
              select: "pagination-select",
              toolbar: "pagination-toolbar",
              spacer: "pagination-spacer",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AuditoriaList;
