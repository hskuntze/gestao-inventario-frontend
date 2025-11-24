import "./styles.css";
import { Accordion, AccordionDetails, AccordionSummary, Box, Modal, TablePagination } from "@mui/material";
import { useEffect, useState } from "react";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import { Controller, useForm } from "react-hook-form";
import { UsuarioResponsavelType } from "@/types/usuario_responsavel";
import { SetorType } from "@/types/area";
import { fetchAllSetores } from "@/utils/functions";
import Loader from "../Loader";

type FormData = {
  nome: string;
  email: string;
  area: SetorType; //área = setor (mudança de nomenclatura)
};

const GerenciarUsuarioResponsavel = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [usuarios, setUsuarios] = useState<UsuarioResponsavelType[]>([]);
  const [filter, setFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [usuarioId, setUsuarioId] = useState<number>();

  const [setores, setSetores] = useState<SetorType[]>([]);

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
    control,
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

    return (
      u.nome.toLowerCase().includes(searchTerm ?? false) ||
      ((u.email ?? "-").toLowerCase().includes(searchTerm) ?? false) ||
      ((u.area ? u.area.nome : "-").toLowerCase().includes(searchTerm) ?? false)
    );
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
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: isEditing ? `/usuarios/responsaveis/update/${usuarioId}` : "/usuarios/responsaveis/register",
      method: isEditing ? "PUT" : "POST",
      withCredentials: true,
      data: {
        nome: formData.nome,
        email: formData.email,
        area: {
          id: formData.area.id,
        },
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
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDeleteUsuarioResponsavel = (id: number) => {
    let confirm = window.confirm("Esta é uma operação irreversível. Tem certeza que deseja excluir este usuário responsável?");

    if (confirm) {
      const requestParams: AxiosRequestConfig = {
        url: `/usuarios/responsaveis/delete/${id}`,
        method: "DELETE",
        withCredentials: true,
      };

      requestBackend(requestParams)
        .then((res) => {
          toast.success("Deletado com sucesso.");
          loadUsuarios();
        })
        .catch((err) => {})
        .finally(() => {});
    }
  };

  const handleEditUsuarioResponsavel = (u: UsuarioResponsavelType) => {
    setOpenModal(true);
    setIsEditing(true);
    setUsuarioId(u.id);

    setValue("nome", u.nome);
    setValue("email", u.email);
    setValue("area", u.area);
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  useEffect(() => {
    async function getSetores() {
      setSetores([]);

      try {
        const data = (await fetchAllSetores()) as SetorType[];
        setSetores(data);
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar os setores";
        toast.error(errorMsg);
      }
    }

    getSetores();
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
                  <th scope="col">Setor</th>
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
                        <div>{a.area ? a.area.nome : "-"}</div>
                      </td>
                      <td>
                        <div className="table-action-buttons">
                          <button
                            onClick={() => handleEditUsuarioResponsavel(a)}
                            className="button action-button nbr"
                            title="Editar usuário responsável"
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            onClick={() => handleDeleteUsuarioResponsavel(a.id)}
                            type="button"
                            className="button action-button delete-button nbr"
                            title="Excluir usuário responsável"
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="no-data-on-table" colSpan={4}>
                      Sem dados a serem exibidos
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>
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
            <div className="div-input-formulario">
              <span>Setor</span>
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
            <div className="div-input-formulario"></div>
            {loading ? (
              <div className="loading-div">
                <Loader />
              </div>
            ) : (
              <div className="form-buttons">
                <button className="button submit-button">Salvar</button>
              </div>
            )}
          </form>
        </Box>
      </Modal>
    </div>
  );
};

export default GerenciarUsuarioResponsavel;
