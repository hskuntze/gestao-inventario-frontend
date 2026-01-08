import Loader from "@/components/Loader";
import { AtivoType } from "@/types/ativo";
import { isAuthenticated } from "@/utils/auth";
import { requestBackend } from "@/utils/requests";
import { TablePagination } from "@mui/material";
import { AxiosRequestConfig } from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import { formatarData } from "@/utils/functions";

const tiposAtivo: { [key: string]: string } = {
  t: "TANGÍVEL",
  i: "INTANGÍVEL",
  tl: "LOCAÇÃO",
};

const PageUsuario = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const [ativos, setAtivos] = useState<AtivoType[]>([]);
  const [filter, setFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const authenticated = isAuthenticated();

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

    return matchesSearch;
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

  useEffect(() => {
    setLoading(true);

    if (authenticated) {
      const requestParams: AxiosRequestConfig = {
        url: "/ativos/all/by/authuser",
        method: "GET",
        withCredentials: true,
      };

      requestBackend(requestParams)
        .then((res) => {
          setAtivos(res.data as AtivoType[]);
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [authenticated]);

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
            <Link to={"/gestao-inventario/ativo/solicitacao/formulario/create"}>
              <button type="button" className="button submit-button auto-width pd-2">
                Solicitar Ativo
              </button>
            </Link>
          </div>
        </div>
        <span className="page-subtitle">Visualize todos os ativos sob sua responsabilidade direta.</span>
      </div>
      {loading ? (
        <div className="loading-div">
          <Loader />
        </div>
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
            </div>
            <div className="div-table">
              <table className="ativo-list-table">
                <thead>
                  <tr>
                    <th className="col-descricao">Descrição</th>
                    <th className="col-id">ID</th>
                    <th className="col-categoria">Categoria</th>
                    <th className="col-localizacao">Localização</th>
                    <th className="col-tipo">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData
                      .filter((a) => !a.desabilitado)
                      .map((a) => (
                        <tr key={a.id} className={`clickable-table-row`}>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageUsuario;
