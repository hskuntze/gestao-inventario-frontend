import "./styles.css";
import { useCallback, useEffect, useState } from "react";
import { AxiosRequestConfig } from "axios";
import { TablePagination } from "@mui/material";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";

import Loader from "@/components/Loader";
import CardSolicitacao from "@/components/CardSolicitacao";

import { SolicitacaoType } from "@/types/solicitacao";

import { requestBackend } from "@/utils/requests";
import { fetchAllUsuariosResponsaveis, formatarData, formatarDataParaDiaMesAno } from "@/utils/functions";
import { UsuarioResponsavelType } from "@/types/usuario_responsavel";
import { toast } from "react-toastify";

const SolicitacoesList = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoType[]>([]);

  const [usuariosResponsaveis, setUsuariosResponsaveis] = useState<UsuarioResponsavelType[]>([]);
  const [selectedUsuarioResponsavel, setSelectedUsuarioResponsavel] = useState<UsuarioResponsavelType | null>(null);

  const [filter, setFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
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

  const filteredData = solicitacoes.filter((s) => {
    const searchTerm = filter.trim().toLowerCase();

    // 🔍 Filtro por texto
    const matchesSearch =
      !searchTerm ||
      s.ativo.descricao.toLowerCase().includes(searchTerm) ||
      s.status.toLowerCase().includes(searchTerm) ||
      s.motivoSolicitacao.toLowerCase().includes(searchTerm) ||
      s.usuarioResponsavel.area.sigla.toLowerCase().includes(searchTerm) ||
      formatarDataParaDiaMesAno(s.dataSolicitacao).toLowerCase().includes(searchTerm) ||
      formatarData(s.dataSolicitacao).toLowerCase().includes(searchTerm) ||
      (s.usuarioResponsavel?.nome ?? "-").toLowerCase().includes(searchTerm);

    const matchesUsuarioResponsavel = !selectedUsuarioResponsavel || s.usuarioResponsavel?.id === selectedUsuarioResponsavel.id;

    return matchesSearch && matchesUsuarioResponsavel;
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleExportToExcel = () => {
    if (filteredData) {
      const wb = XLSX.utils.book_new();

      const solicitacoesProcessadas = filteredData.map((a) => ({
        Ativo: a.ativo.descricao,
        "Data da solicitação": formatarData(a.dataSolicitacao),
        "Usuário responsável": a.usuarioResponsavel.nome,
        "Motivo da solicitação": a.motivoSolicitacao,
        "Data início": formatarData(a.dataInicio),
        "Data fim": formatarData(a.dataFim),
        Status: a.status,
        "Motivo da reprovação": a.motivoReprovado ?? "-",
      }));

      const ws = XLSX.utils.json_to_sheet(solicitacoesProcessadas);

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

      const headers = Object.keys(solicitacoesProcessadas[0]);
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

      XLSX.utils.book_append_sheet(wb, ws, "solicitações");
      XLSX.writeFile(wb, "solicitações-" + new Date().toLocaleDateString() + ".xlsx");
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(15);
    doc.text("Solicitações", 7, 20);

    doc.setFontSize(10);
    const yStart = 30;
    let y = yStart;
    const lineHeight = 8;
    const marginLeft = 7;
    const colWidth = 56;

    filteredData?.forEach((a, i) => {
      doc.setFont("helvetica", "bold");
      doc.text(a.ativo.descricao + " - " + a.status, marginLeft, y);
      y += lineHeight;

      const data = [
        ["Ativo", a.ativo.descricao],
        ["Data da solicitação", formatarData(a.dataSolicitacao)],
        ["Usuário responsável", a.usuarioResponsavel.nome],
        ["Motivo da solicitação", a.motivoSolicitacao],
        ["Data início", formatarData(a.dataInicio)],
        ["Data fim", formatarData(a.dataFim)],
        ["Status", a.status],
        ["Motivo da reprovação", a.motivoReprovado ?? "-"],
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

    doc.save("solicitações-" + new Date().toLocaleDateString() + ".pdf");
  };

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
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /**
   * Atualiza somente a solicitação, dessa maneira não há necessidade de recarregar a página ou recarregar todos os elementos.
   * @param updated
   */
  const handleUpdateSolicitacao = (updated: SolicitacaoType) => {
    setSolicitacoes((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleClearFilters = () => {
    setSelectedUsuarioResponsavel(null);
    setFilter("");
  };

  useEffect(() => {
    loadSolicitacoes();
  }, [loadSolicitacoes]);

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
    <div className="page">
      <div className="page-header">
        <div className="header-content">
          <h2 className="page-title">Meus Ativos</h2>
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
      <div className="page-body w-100">
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
          {loading ? (
            <div className="loading-div">
              <Loader />
            </div>
          ) : (
            <div className="div-table">
              {paginatedData.length > 0 ? (
                paginatedData.map((s) => <CardSolicitacao key={s.id} solicitacao={s} onUpdate={handleUpdateSolicitacao} />)
              ) : (
                <div className="no-data-info">
                  <span>Sem solicitações</span>
                </div>
              )}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolicitacoesList;
