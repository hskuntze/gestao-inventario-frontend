import "./styles.css";
import { useCallback, useEffect, useState } from "react";
import { AtivoType } from "@/types/ativo";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { TablePagination } from "@mui/material";
import AtivoListSkeletonLoader from "./AtivoListSkeletonLoader";

const tiposAtivo: { [key: string]: string } = {
  t: "TANGÍVEL",
  i: "INTANGÍVEL",
  tl: "LOCAÇÃO",
};

const AtivoList = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [ativos, setAtivos] = useState<AtivoType[]>([]);
  const [filter, setFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

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
    const searchTerm = filter.trim();
    if (!searchTerm) return true;

    return (
      a.descricao.toLowerCase().includes(searchTerm) ||
      (String(a.idPatrimonial ?? "N/A")
        .toLowerCase()
        .includes(searchTerm) ??
        false) ||
      (a.categoria.toLowerCase().includes(searchTerm) ?? false) ||
      ((a.localizacao ? a.localizacao.nome : "-").toLowerCase().includes(searchTerm) ?? false) ||
      ((a.usuarioResponsavel ? a.usuarioResponsavel.nome : "-").toLowerCase().includes(searchTerm) ?? false)
    );
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <div className="page">
      <div className="page-header">
        <div className="header-content">
          <h2 className="page-title">Inventário de Ativos</h2>
          <Link to={"/gestao-inventario/ativo/formulario/create"}>
            <button type="button" className="button submit-button auto-width pd-2">
              Adicionar Ativo
            </button>
          </Link>
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
                  className="form-control filtro-input"
                  id="nome-ativo-filtro"
                  placeholder="Digite um termo para filtrar"
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div className="div-table">
              <table className="ativo-list-table">
                <thead>
                  <tr key={"tr-head-ativo-list-table"}>
                    <th scope="col">Descrição</th>
                    <th scope="col">ID</th>
                    <th scope="col">Categoria</th>
                    <th scope="col">Localização</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Usuário Designado</th>
                    <th scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData
                      .filter((a) => !a.desabilitado || !a.devolvido)
                      .map((a) => (
                        <tr key={a.id} className="clickable-table-row" onClick={() => navigate(`/gestao-inventario/ativo/formulario/${a.id}`)}>
                          <td>
                            <div>{a.descricao}</div>
                          </td>
                          <td>
                            <div className="text-info">{a.idPatrimonial}</div>
                          </td>
                          <td>
                            <div className="text-info">{a.categoria}</div>
                          </td>
                          <td>
                            <div className="text-info">{a.localizacao ? a.localizacao.nome : "-"}</div>
                          </td>
                          <td>
                            <div>
                              <span className={`tag-tipo-ativo-${a.tipoAtivo}`}>
                                <i className={`bi bi-tag-fill tag-dot-${a.tipoAtivo}`} /> {tiposAtivo[a.tipoAtivo]}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="text-info">{a.usuarioResponsavel ? a.usuarioResponsavel.nome : "-"}</div>
                          </td>
                          <td>
                            <div className="table-action-buttons">
                              <Link to={`/gestao-inventario/ativo/formulario/${a.id}`} className="button action-button nbr">
                                <i className="bi bi-pencil" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td className="no-data-on-table" colSpan={7}>
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

export default AtivoList;
