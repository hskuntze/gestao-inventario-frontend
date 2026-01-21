import "./styles.css";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AxiosRequestConfig } from "axios";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import { TablePagination } from "@mui/material";

import { UsuarioResponsavelType } from "@/types/usuario_responsavel";
import { HistoricoComAtivoType } from "@/types/historicocomativo";

import { requestBackend } from "@/utils/requests";
import { fetchAllUsuariosResponsaveis, formatarData } from "@/utils/functions";

import Loader from "@/components/Loader";

const RelatorioMovimentacao = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [registros, setRegistros] = useState<HistoricoComAtivoType[]>([]);

  const [filter, setFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const [usuariosResponsaveis, setUsuariosResponsaveis] = useState<UsuarioResponsavelType[]>([]);
  const [selectedUsuarioResponsavel, setSelectedUsuarioResponsavel] = useState<UsuarioResponsavelType | null>(null);
  const [selectedUsuarioMovimentacao, setSelectedUsuarioMovimentacao] = useState<UsuarioResponsavelType | null>(null);

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

  const loadRegistros = useCallback(() => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/relatorios/historico/movimentacao",
      withCredentials: true,
      method: "GET",
    };

    requestBackend(requestParams)
      .then((res) => {
        let data = res.data as HistoricoComAtivoType[];
        setRegistros(data);
      })
      .catch((err) => {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar os registros de movimentação";
        toast.error(errorMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleClearFilters = () => {
    setSelectedUsuarioMovimentacao(null);
    setSelectedUsuarioResponsavel(null);
    setFilter("");
  };

  const filteredData = registros.filter((r) => {
    const searchTerm = filter.trim().toLowerCase();

    // 🔍 Filtro por texto
    const matchesSearch =
      !searchTerm ||
      r.ativo.descricao.toLowerCase().includes(searchTerm) ||
      r.usuarioResponsavel.toLowerCase().includes(searchTerm) ||
      r.localizacao.toLowerCase().includes(searchTerm) ||
      r.area.toLowerCase().includes(searchTerm);

    const matchesUsuarioResponsavel = !selectedUsuarioResponsavel || r.usuarioResponsavel === selectedUsuarioResponsavel.nome;
    const matchesUsuarioMovimentacao = !selectedUsuarioMovimentacao || r.userNome === selectedUsuarioMovimentacao.nome;

    return matchesSearch && matchesUsuarioResponsavel && matchesUsuarioMovimentacao;
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleExportToExcel = () => {
      if (filteredData) {
        const wb = XLSX.utils.book_new();
  
        const registrosProcessados = filteredData.map((a) => ({
          "ID Patrimonial": a.ativo.idPatrimonial,
          "Descrição": a.ativo.descricao,
          "Número de Série": a.ativo.codigoSerie,
          "Operação": a.operacao,
          "Área": a.area,
          "Localização": a.localizacao,
          "Usuário Responsável": a.usuarioResponsavel,
          "Data da movimentação": formatarData(a.createdAt),
        }));
  
        const ws = XLSX.utils.json_to_sheet(registrosProcessados);
  
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
  
        const headers = Object.keys(registrosProcessados[0]);
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
  
        XLSX.utils.book_append_sheet(wb, ws, "Relatório");
        XLSX.writeFile(wb, "relatório-movimentacao-" + new Date().toLocaleDateString() + ".xlsx");
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
        doc.text(a.ativo.descricao + " - " + a.ativo.idPatrimonial, marginLeft, y);
        y += lineHeight;
  
        const data = [
          ["ID Patrimonial", a.ativo.idPatrimonial],
          ["Descrição", a.ativo.descricao],
          ["Número de Série", a.ativo.codigoSerie],
          ["Operação", a.operacao],
          ["Área", a.area],
          ["Localização", a.localizacao],
          ["Usuário Responsável", a.usuarioResponsavel],
          ["Data da movimentação", formatarData(a.createdAt)],
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
  
      doc.save("relatorio-movimentacao" + new Date().toLocaleDateString() + ".pdf");
    };

  useEffect(() => {
    loadRegistros();
  }, [loadRegistros]);

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

  return (
    <div className="relatorio">
      <div className="page-header">
        <div className="header-content">
          <h2 className="page-title">Relatório de Movimentação</h2>
          <div className="header-buttons">
            <button type="button" className="button general-button auto-width pd-2" onClick={handleExportPDF}>
              Exportar PDF
            </button>
            <button type="button" className="button general-button auto-width pd-2" onClick={handleExportToExcel}>
              Exportar Excel
            </button>
          </div>
        </div>
        <span className="page-subtitle">Visualize, aprove ou reprove solicitações pendentes de ativos.</span>
      </div>
      <div className="report-page-body">
        <div className="list-content-container pd-0">
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
                name="por-usuario-responsavel"
                id="por-usuario-responsavel"
                className={`filtro-input`}
                onChange={(e) => {
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
                  Selecione um usuário responsável
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
                name="por-usuario-movimentacao"
                id="por-usuario-movimentacao"
                className={`filtro-input`}
                onChange={(e) => {
                  let value = e.target.value;

                  let ur = usuariosResponsaveis.find((ur) => ur.nome === value);

                  if (ur) {
                    setSelectedUsuarioMovimentacao(ur);
                  } else {
                    setSelectedUsuarioMovimentacao(null);
                  }
                }}
                value={selectedUsuarioMovimentacao ? selectedUsuarioMovimentacao.nome : ""}
              >
                <option key={"usuario-movimentacao-no-option"} value="">
                  Selecione quem movimentou
                </option>
                {usuariosResponsaveis.map((ur) => (
                  <option key={ur.id} value={ur.nome}>
                    {ur.nome}
                  </option>
                ))}
              </select>
            </div>
            <button className="button general-button auto-width pd-3" type="button" onClick={handleClearFilters}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
          {loading ? (
            <div className="loading-div">
              <Loader />
            </div>
          ) : (
            <div className="div-table">
              <table className="ativo-list-table">
                <thead>
                  <tr key={"tr-head-relatorio-movimentacao-list-table"}>
                    <th>Ativo</th>
                    <th className="col-usuario-mov">Usuário Responsável</th>
                    <th>Setor</th>
                    <th>Localização</th>
                    <th className="col-usuario-mov">Movimentado Por</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((r) => (
                      <tr key={r.id} className="clickable-table-row">
                        <td>
                          <div>{r.ativo.descricao}</div>
                        </td>
                        <td className="col-usuario-mov">
                          <div>{r.usuarioResponsavel}</div>
                        </td>
                        <td>
                          <div>{r.area}</div>
                        </td>
                        <td>
                          <div>{r.localizacao}</div>
                        </td>
                        <td className="col-usuario-mov">
                          <div>{r.userNome}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="no-data-on-table" colSpan={5}>
                        Sem dados a serem exibidos
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5}>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatorioMovimentacao;
