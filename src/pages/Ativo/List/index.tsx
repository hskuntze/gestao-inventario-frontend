import "./styles.css";
import { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import { AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { Box, Modal, TablePagination } from "@mui/material";

import { AtivoType } from "@/types/ativo";
import { SetorType } from "@/types/area";
import { LocalizacaoType } from "@/types/localizacao";
import { UsuarioResponsavelType } from "@/types/usuario_responsavel";
import { ContratoType } from "@/types/contrato";
import { FornecedorType } from "@/types/fornecedor";

import {
  fetchAllContratos,
  fetchAllFornecedores,
  fetchAllLocalizacoesByAreaId,
  fetchAllSetores,
  fetchAllUsuariosResponsaveisByAreaId,
  formatarData,
} from "@/utils/functions";
import { requestBackend } from "@/utils/requests";

import AtivoListSkeletonLoader from "./AtivoListSkeletonLoader";
import { Controller, useForm } from "react-hook-form";

const tiposAtivo: { [key: string]: string } = {
  t: "TANGÍVEL",
  i: "INTANGÍVEL",
  tl: "LOCAÇÃO",
};

type FormData = {
  area: SetorType; //área = setor (mudança de nomenclatura)
  localizacao: LocalizacaoType;
  usuarioResponsavel: UsuarioResponsavelType;
};

const AtivoList = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [ativos, setAtivos] = useState<AtivoType[]>([]);
  const [filter, setFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const [setores, setSetores] = useState<SetorType[]>([]);
  const [localizacoes, setLocalizacoes] = useState<LocalizacaoType[]>([]);
  const [usuariosResponsaveis, setUsuariosResponsaveis] = useState<UsuarioResponsavelType[]>([]);
  const [contratos, setContratos] = useState<ContratoType[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorType[]>([]);

  const [selectedTipoAtivo, setSelectedTipoAtivo] = useState<"t" | "tl" | "i" | null>(null);
  const [selectedSetor, setSelectedSetor] = useState<SetorType | null>(null);
  const [selectedLocalizacao, setSelectedLocalizacao] = useState<LocalizacaoType | null>(null);
  const [selectedUsuarioResponsavel, setSelectedUsuarioResponsavel] = useState<UsuarioResponsavelType | null>(null);
  const [selectedContrato, setSelectedContrato] = useState<ContratoType | null>(null);
  const [selectedFornecedor, setSelectedFornecedor] = useState<FornecedorType | null>(null);

  const [openAcoes, setOpenAcoes] = useState<boolean>(false);
  const acoesDropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Para seleção em lote
   */
  const [loteMode, setLoteMode] = useState<boolean>(false);
  const [selectedAtivos, setSelectedAtivos] = useState<number[]>([]);
  const [openModalMovimentacao, setOpenModalMovimentacao] = useState<boolean>(false);

  /**
   * Para realizar a movimentação em lote
   */
  const [selectedSetorLote, setSelectedSetorLote] = useState<SetorType | null>(null);

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<FormData>();

  const navigate = useNavigate();

  const loadAtivos = useCallback(() => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/ativos/all",
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        let data = res.data as AtivoType[];
        setAtivos(data);
      })
      .catch((err) => {
        toast.error("Erro ao tentar carregar os ativos.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadAtivos();
  }, [loadAtivos]);

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

  const filteredData = ativos.filter((a) => {
    const searchTerm = filter.trim().toLowerCase();

    // 🔍 Filtro por texto
    const matchesSearch =
      !searchTerm ||
      a.descricao.toLowerCase().includes(searchTerm) ||
      String(a.idPatrimonial ?? "")
        .toLowerCase()
        .includes(searchTerm) ||
      a.categoria.toLowerCase().includes(searchTerm) ||
      (a.localizacao?.nome ?? "-").toLowerCase().includes(searchTerm) ||
      (a.usuarioResponsavel?.nome ?? "-").toLowerCase().includes(searchTerm);

    // Filtro por tipo do ativo
    const matchesTipoAtivo = !selectedTipoAtivo || a.tipoAtivo === selectedTipoAtivo;

    // Filtro por setor
    const matchesSetor = !selectedSetor || a.area?.id === selectedSetor.id;

    // Filtro por localização
    const matchesLocalizacao = !selectedLocalizacao || a.localizacao?.id === selectedLocalizacao.id;

    // Filtro por usuário responsável
    const matchesUsuarioResponsavel = !selectedUsuarioResponsavel || a.usuarioResponsavel?.id === selectedUsuarioResponsavel.id;

    // Filtro por contrato
    const matchesContrato = !selectedContrato || a.contrato?.id === selectedContrato.id;

    // Filtro por contrato
    const matchesFornecedor = !selectedFornecedor || a.fornecedor?.id === selectedFornecedor.id;

    // ✔ Retorna verdadeiro somente se passar em todos
    return (
      matchesTipoAtivo && matchesSearch && matchesSetor && matchesLocalizacao && matchesUsuarioResponsavel && matchesContrato && matchesFornecedor
    );
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleExportToExcel = () => {
    if (filteredData) {
      const wb = XLSX.utils.book_new();

      const ativosProcessados = filteredData.map((a) => ({
        "ID Patrimonial": a.idPatrimonial,
        Categoria: a.categoria,
        Descrição: a.descricao,
        Setor: a.area ? String(a.area.nome + "(" + a.area.sigla + ")") : "-",
        Localização: a.localizacao ? a.localizacao.nome : "-",
        "Usuário Responsável": a.usuarioResponsavel ? a.usuarioResponsavel.nome : "-",
        Contrato: a.contrato.numeroContrato,
        Fornecedor: a.fornecedor.nome,
        "Data de Aquisição": formatarData(a.dataAquisicao),
        "Data de devolução prevista": a.dataDevolucaoPrevista ? formatarData(a.dataDevolucaoPrevista) : "N/A",
        "Data de devolução realizada": a.dataDevolucaoRealizada ? formatarData(a.dataDevolucaoRealizada) : "N/A",
        "Número de parte": a.numeroParte ?? "-",
        "Número de série": a.codigoSerie,
        "Estado de conservação": a.estadoConservacao ?? "N/A",
      }));

      const ws = XLSX.utils.json_to_sheet(ativosProcessados);

      if (!ws["!ref"]) {
        console.error("Worksheet sem dados (ws['!ref'] indefinido)");
        return;
      }

      const range = XLSX.utils.decode_range(ws["!ref"]);

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellRef];

          if (cell) {
            cell.s = {
              ...(cell.s || {}),
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
            };
          }
        }
      }

      const headers = Object.keys(ativosProcessados[0]);
      headers.forEach((_, idx) => {
        const cell = XLSX.utils.encode_cell({ r: 0, c: idx }); // linha 0, coluna idx
        if (ws[cell]) {
          ws[cell].s = {
            fill: { patternType: "solid", fgColor: { rgb: "D9E1F2" } },
            font: { bold: true },
            alignment: { horizontal: "center", vertical: "center" },
          };
        }
      });

      XLSX.utils.book_append_sheet(wb, ws, "ativos");
      XLSX.writeFile(wb, "ativos-" + new Date().toLocaleDateString() + ".xlsx");
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(15);
    doc.text("Ativos", 7, 20);

    doc.setFontSize(10);
    const yStart = 30;
    let y = yStart;
    const lineHeight = 8;
    const marginLeft = 7;
    const colWidth = 56;

    filteredData?.forEach((a, i) => {
      doc.setFont("helvetica", "bold");
      doc.text(a.descricao + " - " + a.idPatrimonial, marginLeft, y);
      y += lineHeight;

      const data = [
        ["Descrição", a.descricao],
        ["ID Patrimonial", a.idPatrimonial],
        ["Categoria", a.categoria],
        ["Setor", a.area ? `${a.area.nome} (${a.area.sigla})` : "-"],
        ["Localização", a.localizacao ? a.localizacao.nome : "-"],
        ["Usuário Responsável", a.usuarioResponsavel ? a.usuarioResponsavel.nome : "-"],
        ["Contrato", a.contrato.numeroContrato],
        ["Fornecedor", a.fornecedor.nome],
        ["Data de Aquisição", formatarData(a.dataAquisicao)],
        ["Data de devolução prevista", a.dataDevolucaoPrevista ? formatarData(a.dataDevolucaoPrevista) : "N/A"],
        ["Data de devolução realizada", a.dataDevolucaoRealizada ? formatarData(a.dataDevolucaoRealizada) : "N/A"],
        ["Número de parte", a.numeroParte ?? "-"],
        ["Número de série", a.codigoSerie],
        ["Estado de conservação", a.estadoConservacao],
      ];

      data.forEach(([k, v]) => {
        doc.setFont("helvetica", "bold");
        doc.text(k, marginLeft, y);
        doc.setFont("helvetica", "normal");
        const textLines = doc.splitTextToSize(v, 100); // Define a largura máxima de 100px
        doc.text(textLines, marginLeft + colWidth, y);

        y += textLines.length * lineHeight;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      doc.setDrawColor(0); // preto
      doc.setLineWidth(0.3);
      doc.line(marginLeft, y, 200, y); // linha horizontal

      y += 10;
    });

    doc.save("ativos-" + new Date().toLocaleDateString() + ".pdf");
  };

  const handleClearFilters = () => {
    setSelectedTipoAtivo(null);
    setSelectedContrato(null);
    setSelectedFornecedor(null);
    setSelectedLocalizacao(null);
    setSelectedSetor(null);
    setSelectedUsuarioResponsavel(null);
    setFilter("");
  };

  const onSubmitMovimentacao = (formData: FormData) => {
    const requestParams: AxiosRequestConfig = {
      url: "/ativos/movimentar/lote",
      method: "POST",
      withCredentials: true,
      data: {
        ids: selectedAtivos,
        idArea: formData.area.id,
        idLocalizacao: formData.localizacao.id,
        idUsuarioResponsavel: formData.usuarioResponsavel.id,
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success("Sucesso ao movimentar ativos em lote");
        navigate(0);
      })
      .catch((err) => {
        toast.error("Erro ao tentar movimentar ativos em lote");
        console.error(err);
      })
      .finally(() => {});
  };

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
      setFornecedores([]);

      try {
        const data = (await fetchAllFornecedores()) as FornecedorType[];
        setFornecedores(data.filter((f) => !f.desabilitado));
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

        if (selectedSetorLote) {
          const data = await fetchAllUsuariosResponsaveisByAreaId(selectedSetorLote.id);
          setUsuariosResponsaveis(data.filter((u) => !u.desabilitado));
        }
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar usuários responsáveis";
        toast.error(errorMsg);
      }
    }

    getUsuariosResponsaveis();
  }, [selectedSetor, selectedSetorLote]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="header-content">
          <h2 className="page-title">Inventário de Ativos</h2>
          <div className="header-buttons">
            <div className="acoes-button" ref={acoesDropdownRef}>
              <button type="button" className="button general-button auto-width pd-2" onClick={() => setOpenAcoes(!openAcoes)}>
                Ações <i className="bi bi-chevron-down" />
              </button>
              {openAcoes && (
                <div className="acoes-menu">
                  <button
                    type="button"
                    className="movimentacao-button"
                    style={{ marginLeft: 0 }}
                    onClick={() => {
                      setLoteMode((prev) => !prev);
                      setSelectedAtivos([]);
                      setOpenAcoes(false);
                    }}
                  >
                    {loteMode ? "Cancelar seleção" : "Movimentar em Lote"}
                  </button>
                </div>
              )}
            </div>
            <button type="button" className="button general-button auto-width pd-2" onClick={handleExportPDF}>
              Exportar PDF
            </button>
            <button type="button" className="button general-button auto-width pd-2" onClick={handleExportToExcel}>
              Exportar Excel
            </button>
            <Link to={"/gestao-inventario/ativo/formulario/create"}>
              <button type="button" className="button submit-button auto-width pd-2">
                Adicionar Ativo
              </button>
            </Link>
          </div>
        </div>
        <span className="page-subtitle">Visualize e gerencie todos os ativos.</span>
      </div>
      {loading ? (
        <AtivoListSkeletonLoader />
      ) : (
        <div className="page-body w-100">
          <div className="list-content-container pd-0">
            <div className="filtro-container">
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
                  name="por-area"
                  id="por-area"
                  className={`filtro-input`}
                  onChange={(e) => {
                    let value = e.target.value as "t" | "tl" | "i";

                    if (value) {
                      setSelectedTipoAtivo(value);
                    } else {
                      setSelectedTipoAtivo(null);
                    }
                  }}
                  value={selectedTipoAtivo ? selectedTipoAtivo : ""}
                >
                  <option key={"tipo-ativo-no-option"} value="">
                    Selecione um tipo de ativo
                  </option>
                  <option key={"tipo-ativo-tangivel"} value="t">
                    TANGÍVEL
                  </option>
                  <option key={"tipo-ativo-intangivel"} value="i">
                    INTANGÍVEL
                  </option>
                  <option key={"tipo-ativo-locacao"} value="tl">
                    LOCAÇÃO
                  </option>
                </select>
              </div>
              <div className="filtro-input-div form-floating">
                <i className="bi bi-search" />
                <select
                  name="por-area"
                  id="por-area"
                  className={`filtro-input`}
                  onChange={(e) => {
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
                  className={`filtro-input ${selectedSetor !== null ? "" : "disabled-field"}`}
                  onChange={(e) => {
                    let value = e.target.value;

                    let ur = usuariosResponsaveis.find((ur) => ur.id === Number(value));

                    if (ur) {
                      setSelectedUsuarioResponsavel(ur);
                    } else {
                      setSelectedUsuarioResponsavel(null);
                    }
                  }}
                  disabled={selectedSetor === null}
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
              <div className="filtro-input-div form-floating">
                <i className="bi bi-search" />
                <select
                  name="por-contrato"
                  id="por-contrato"
                  className={`filtro-input`}
                  onChange={(e) => {
                    let value = e.target.value;

                    let contrato = contratos.find((c) => c.id === Number(value));

                    if (contrato) {
                      setSelectedContrato(contrato);
                    } else {
                      setSelectedContrato(null);
                    }
                  }}
                  value={selectedContrato ? selectedContrato.id : ""}
                >
                  <option key={"contrato-no-option"} value="">
                    Selecione um contrato
                  </option>
                  {contratos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.numeroContrato}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filtro-input-div form-floating">
                <i className="bi bi-search" />
                <select
                  name="por-fornecedor"
                  id="por-fornecedor"
                  className={`filtro-input ${selectedContrato === null ? "" : "disabled-field"}`}
                  onChange={(e) => {
                    let value = e.target.value;

                    let fornecedor = fornecedores.find((f) => f.id === Number(value));

                    if (fornecedor) {
                      setSelectedFornecedor(fornecedor);
                    } else {
                      setSelectedFornecedor(null);
                    }
                  }}
                  value={selectedContrato ? selectedContrato.fornecedor.id : selectedFornecedor ? selectedFornecedor.id : ""}
                  disabled={selectedContrato === null ? false : true}
                >
                  <option key={"fornecedor-no-option"} value="">
                    Selecione um fornecedor
                  </option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              </div>
              <button className="button general-button auto-width pd-3" type="button" onClick={handleClearFilters}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="div-table">
              <table className="ativo-list-table">
                <thead>
                  <tr key={"tr-head-ativo-list-table"}>
                    {loteMode && (
                      <th className="col-select">
                        <input
                          type="checkbox"
                          checked={paginatedData.length > 0 && paginatedData.every((a) => selectedAtivos.includes(a.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const idsDaPagina = paginatedData.map((a) => a.id);
                              setSelectedAtivos((prev) => Array.from(new Set([...prev, ...idsDaPagina])));
                            } else {
                              const idsDaPagina = paginatedData.map((a) => a.id);
                              setSelectedAtivos((prev) => prev.filter((id) => !idsDaPagina.includes(id)));
                            }
                          }}
                        />
                      </th>
                    )}
                    <th className="col-descricao">Descrição</th>
                    <th className="col-id">ID</th>
                    <th className="col-categoria">Categoria</th>
                    <th className="col-localizacao">Localização</th>
                    <th className="col-tipo">Tipo</th>
                    <th className="col-usuario">Usuário Designado</th>
                    <th className="col-acoes">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData
                      .filter((a) => !a.desabilitado)
                      .filter((a) => !a.devolvido)
                      .map((a) => (
                        <tr
                          key={a.id}
                          className={`clickable-table-row ${selectedAtivos.includes(a.id) ? "row-selected" : ""}`}
                          onClick={() => {
                            if (!loteMode) {
                              navigate(`/gestao-inventario/ativo/formulario/${a.id}`);
                            }
                          }}
                        >
                          {loteMode && (
                            <td onClick={(e) => e.stopPropagation()} className="col-select">
                              <input
                                type="checkbox"
                                checked={selectedAtivos.includes(a.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAtivos((prev) => [...prev, a.id]);
                                  } else {
                                    setSelectedAtivos((prev) => prev.filter((id) => id !== a.id));
                                  }
                                }}
                              />
                            </td>
                          )}
                          <td className="col-descricao">
                            <div>{a.descricao}</div>
                          </td>
                          <td className="col-id">
                            <div className="text-info">{a.idPatrimonial}</div>
                          </td>
                          <td className="col-categoria">
                            <div className="text-info">{a.categoria}</div>
                          </td>
                          <td className="col-localizacao">
                            <div className="text-info">{a.localizacao ? a.localizacao.nome : "-"}</div>
                          </td>
                          <td className="col-tipo">
                            <div>
                              <span className={`tag-tipo-ativo-${a.tipoAtivo}`}>
                                <i className={`bi bi-tag-fill tag-dot-${a.tipoAtivo}`} /> {tiposAtivo[a.tipoAtivo]}
                              </span>
                            </div>
                          </td>
                          <td className="col-usuario">
                            <div className="text-info">{a.usuarioResponsavel ? a.usuarioResponsavel.nome : "-"}</div>
                          </td>
                          <td className="col-acoes">
                            <div className="table-action-buttons">
                              {!loteMode && (
                                <Link to={`/gestao-inventario/ativo/formulario/${a.id}`} className="button action-button nbr">
                                  <i className="bi bi-pencil" />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td className="no-data-on-table" colSpan={loteMode ? 8 : 7}>
                        Sem dados a serem exibidos
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6}>
                      <TablePagination
                        className="table-pagination-container"
                        component="div"
                        count={filteredData.length}
                        page={page}
                        onPageChange={handlePageChange}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
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
                    </td>
                  </tr>
                </tfoot>
              </table>
              {loteMode && selectedAtivos.length > 0 && (
                <div className="lote-actions-bar">
                  <button className="button submit-button" onClick={() => setOpenModalMovimentacao(true)}>
                    Movimentar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal className="modal-container" open={openModalMovimentacao} onClose={() => setOpenModalMovimentacao(false)}>
        <Box className="modal-content">
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
                      const selectedSetor = setores.find((a) => a.id === selectedId) as SetorType;

                      field.onChange(selectedSetor || null);
                      setSelectedSetorLote(selectedSetor);
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
    </div>
  );
};

export default AtivoList;
