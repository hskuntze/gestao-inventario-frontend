import "./styles.css";
import { Accordion, AccordionDetails, AccordionSummary, Box, Modal, TablePagination } from "@mui/material";
import { useEffect, useState } from "react";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { UsuarioResponsavelType } from "@/types/usuario_responsavel";

type FormData = {
  nome: string;
  email: string;
};

const GerenciarUsuarioResponsavel = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [usuarios, setUsuarios] = useState<UsuarioResponsavelType[]>([]);
  const [reload, setReload] = useState<boolean>(false);
  const [filter, setFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [usuarioId, setUsuarioId] = useState<number>();

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<FormData>();

  const handleToggleModal = () => {
    setOpenModal(!openModal);

    setValue("nome", "");
    setValue("email", "");
  };

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

  const filteredData = usuarios.filter((u) => {
    const searchTerm = filter.trim();
    if (!searchTerm) return true;

    return u.nome.toLowerCase().includes(searchTerm) || (u.email.toLowerCase().includes(searchTerm) ?? false);
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const loadUsuarios = () => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/usuarios/responsaveis/all",
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        let data = res.data as UsuarioResponsavelType[];
        setUsuarios(data);
      })
      .catch((err) => {
        toast.error("Erro ao tentar carregar os usuários responsáveis. Erro: " + err.data.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onSubmit = (formData: FormData) => {
    const requestParams: AxiosRequestConfig = {
      url: isEditing ? `/usuarios/responsaveis/update/${usuarioId}` : "/usuarios/responsaveis/register",
      method: isEditing ? "PUT" : "POST",
      withCredentials: true,
      data: {
        nome: formData.nome,
        email: formData.email,
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success(`Usuário responsável ${isEditing ? "editado" : "criado"} com sucesso.`);
        loadUsuarios();
        handleToggleModal();
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Erro ao tentar atualizar o usuário responsável.";
        toast.error(message);
        handleToggleModal();
      })
      .finally(() => {});
  };

  const handleDeleteArea = (id: number) => {};

  const handleEditUsuario = (u: UsuarioResponsavelType) => {
    setOpenModal(true);
    setIsEditing(true);
    setUsuarioId(u.id);

    setValue("nome", u.nome);
    setValue("email", u.email);
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  return (
    <div className="component-accordion" id="gerenciar-usuario-responsavel">
      <Accordion
        classes={{
          root: "bg-card-blue content-container",
        }}
      >
        <AccordionSummary
          expandIcon={<i className="bi bi-chevron-down" />}
          aria-controls="gerenciar-usuario-responsavel"
          id="gerenciar-usuario-responsavel-header"
          className="accordion-title"
        >
          Usuários responsáveis
        </AccordionSummary>
        <AccordionDetails>
          <div className="accordion-header">
            <div className="filtro-container">
              <div className="filtro-input-div form-floating">
                <i className="bi bi-search" />
                <input
                  type="text"
                  className="form-control filtro-input"
                  id="usuario-responsavel-filtro"
                  placeholder="Digite um termo para filtrar"
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div>
              <button onClick={handleToggleModal} type="button" className="button submit-button auto-width pd-2">
                <i className="bi bi-plus" />
                Adicionar Usuário Responsável
              </button>
            </div>
          </div>
          <div className="div-table">
            <table className="usuario-responsavel-list-table">
              <thead>
                <tr key={"tr-head-usuario-responsavel-list-table"}>
                  <th scope="col">Nome</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div>{a.nome}</div>
                      </td>
                      <td>
                        <div>{a.email ?? "-"}</div>
                      </td>
                      <td>
                        <div className="table-action-buttons">
                          <button onClick={() => handleEditUsuario(a)} className="button action-button nbr">
                            <i className="bi bi-pencil" />
                          </button>
                          <button onClick={() => handleDeleteArea(a.id)} type="button" className="button action-button delete-button nbr">
                            <i className="bi bi-trash3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="no-data-on-table" colSpan={3}>
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
        </AccordionDetails>
      </Accordion>
      <Modal open={openModal} onClose={handleToggleModal} className="modal-container">
        <Box className="modal-content">
          <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
            <div className="div-input-formulario">
              <span>Nome</span>
              <input
                type="text"
                className={`input-formulario ${errors.nome ? "input-error" : ""}`}
                {...register("nome", { required: "Campo obrigatório" })}
                maxLength={255}
              />
              <div className="invalid-feedback d-block div-erro">{errors.nome?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>E-mail</span>
              <input
                type="text"
                className={`input-formulario ${errors.email ? "input-error" : ""}`}
                {...register("email", { required: "Campo obrigatório" })}
                maxLength={255}
              />
              <div className="invalid-feedback d-block div-erro">{errors.email?.message}</div>
            </div>
            <div className="form-buttons">
              <button className="button submit-button">Salvar</button>
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  );
};

export default GerenciarUsuarioResponsavel;
