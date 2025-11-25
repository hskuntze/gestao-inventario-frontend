import "./styles.css";
import { Accordion, AccordionDetails, AccordionSummary, Box, Modal, TablePagination } from "@mui/material";
import { useEffect, useState } from "react";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import { Controller, useForm } from "react-hook-form";
import { Perfil } from "@/types/perfil";
import { User } from "@/types/user";
import { fetchAllUsuariosResponsaveis, formatarPerfil } from "@/utils/functions";
import { hasAnyRoles } from "@/utils/auth";
import { getUserData } from "@/utils/storage";
import Loader from "../Loader";
import { UsuarioResponsavelType } from "@/types/usuario_responsavel";

type FormData = {
  nome: string;
  email: string;
  login: string;
  perfilUsuario: Perfil;
  senha: string;
  termoParceria: string;
  usuarioResponsavel: UsuarioResponsavelType | null;
};

const GerenciarUsuario = () => {
  const user = getUserData();

  const [loading, setLoading] = useState<boolean>(false);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [filter, setFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [usuarioId, setUsuarioId] = useState<number>();

  const [usuariosResponsaveis, setUsuariosResponsaveis] = useState<UsuarioResponsavelType[]>([]);

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminTp, setIsAdminTp] = useState<boolean>(false);

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
    control,
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      nome: "",
      email: "",
      login: "",
      senha: "",
      perfilUsuario: { id: -1, autorizacao: "" },
      termoParceria: "",
      usuarioResponsavel: null,
    },
  });

  const emailValue = watch("email");

  const handleToggleModal = () => {
    setOpenModal(!openModal);

    reset();
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
      u.nome.toLowerCase().includes(searchTerm) ||
      (u.email.toLowerCase().includes(searchTerm) ?? false) ||
      (u.login.toLowerCase().includes(searchTerm) ?? false)
    );
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const loadUsuarios = () => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/usuarios/all",
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        let data = res.data as User[];
        setUsuarios(data);
      })
      .catch((err) => {
        toast.error("Erro ao tentar carregar os usuários do sistema. Erro: " + err.data.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onSubmit = (formData: FormData) => {
    setLoading(true);

    let usuarioResponsavelId = formData.usuarioResponsavel ? formData.usuarioResponsavel.id : null;
    let usuarioEmail = formData.email + "@ctcea.org.br";

    const requestParams: AxiosRequestConfig = {
      url: isEditing ? `/usuarios/update/${usuarioId}` : "/usuarios/register",
      method: isEditing ? "PUT" : "POST",
      withCredentials: true,
      data: {
        nome: formData.usuarioResponsavel?.nome,
        email: usuarioEmail,
        login: formData.login,
        password: formData.senha,
        termoParceria: isAdmin ? formData.termoParceria : user.termoParceria,
        perfis: [
          {
            id: formData.perfilUsuario.id,
          },
        ],
        usuarioResponsavel: {
          id: usuarioResponsavelId,
        },
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success(`Usuário do sistema ${isEditing ? "editado" : "criado"} com sucesso.`);
        loadUsuarios();
        handleToggleModal();
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Erro ao tentar atualizar o usuário do sistema.";
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleEditUsuario = (u: User) => {
    setOpenModal(true);
    setIsEditing(true);
    setUsuarioId(u.id);

    setValue("nome", u.nome);
    setValue("email", u.email);
    setValue("login", u.login);
    setValue("perfilUsuario", u.perfis[0]);
    setValue("termoParceria", u.termoParceria);
    setValue("usuarioResponsavel", u.usuarioResponsavel ?? null);
  };

  const handleDisableUser = (id: number) => {
    let confirm = window.confirm("Deseja desabilitar este usuário?");

    if (confirm) {
      const requestParams: AxiosRequestConfig = {
        url: "/usuarios/operacao/desabilitar",
        method: "POST",
        withCredentials: true,
        params: {
          userId: id,
        },
      };

      requestBackend(requestParams)
        .then(() => {
          toast.success("Usuário desabilitado.");
          loadUsuarios();
        })
        .catch((err) => {
          let message = err.response.data.message;
          if (message) {
            toast.error(message);
          } else {
            toast.error("Erro ao tentar desabilitar usuário.");
          }
        })
        .finally(() => {});
    }
  };

  const handleEnableUser = (id: number) => {
    let confirm = window.confirm("Deseja habilitar este usuário?");

    if (confirm) {
      const requestParams: AxiosRequestConfig = {
        url: "/usuarios/operacao/habilitar",
        method: "POST",
        withCredentials: true,
        params: {
          userId: id,
        },
      };

      requestBackend(requestParams)
        .then(() => {
          toast.success("Usuário habilitado.");
          loadUsuarios();
        })
        .catch((err) => {
          toast.error("Erro ao tentar habilitar usuário.");
        })
        .finally(() => {});
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  useEffect(() => {
    setIsAdmin(hasAnyRoles([{ id: 1, autorizacao: "PERFIL_ADMIN" }]));
  }, []);

  useEffect(() => {
    setIsAdminTp(hasAnyRoles([{ id: 2, autorizacao: "PERFIL_ADMIN_TP" }]));
  }, []);

  useEffect(() => {
    setValue("login", emailValue || "", { shouldValidate: true });
  }, [emailValue, setValue]);

  useEffect(() => {
    async function getUsuariosResponsaveis() {
      setUsuariosResponsaveis([]);

      try {
        const data = await fetchAllUsuariosResponsaveis();
        setUsuariosResponsaveis(data);
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar usuários responsáveis";
        toast.error(errorMsg);
      }
    }

    getUsuariosResponsaveis();
  }, []);

  return (
    <div className="component-accordion" id="gerenciar-usuario">
      <Accordion
        classes={{
          root: "bg-card-blue content-container",
        }}
      >
        <AccordionSummary
          expandIcon={<i className="bi bi-chevron-down" />}
          aria-controls="gerenciar-usuario"
          id="gerenciar-usuario-header"
          className="accordion-title"
        >
          Usuários do sistema
        </AccordionSummary>
        <AccordionDetails>
          <div className="accordion-header">
            <div className="filtro-container">
              <div className="filtro-input-div form-floating">
                <i className="bi bi-search" />
                <input
                  type="text"
                  className="form-control filtro-input"
                  id="usuario-filtro"
                  placeholder="Digite um termo para filtrar"
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div>
              <button
                onClick={() => {
                  handleToggleModal();
                  setIsEditing(false);
                }}
                type="button"
                className="button submit-button auto-width pd-2"
              >
                <i className="bi bi-plus" />
                Adicionar Usuário do Sistema
              </button>
            </div>
          </div>
          <div className="div-table">
            <table className="usuario-list-table">
              <thead>
                <tr key={"tr-head-usuario-list-table"}>
                  <th scope="col">Nome</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Login</th>
                  <th scope="col">Perfil</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div>{u.nome}</div>
                      </td>
                      <td>
                        <div>{u.email}</div>
                      </td>
                      <td>
                        <div>{u.login}</div>
                      </td>
                      <td>
                        <div>{formatarPerfil(u.perfis[0].autorizacao)}</div>
                      </td>
                      <td>
                        <div className="table-action-buttons">
                          <button onClick={() => handleEditUsuario(u)} className="button action-button nbr" title="Editar usuário">
                            <i className="bi bi-pencil" />
                          </button>
                          {u.userEnabled === true ? (
                            <button
                              onClick={() => handleDisableUser(u.id)}
                              type="button"
                              className="button action-button delete-button nbr"
                              title="Desabilitar usuário"
                            >
                              <i className="bi bi-x-circle" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEnableUser(u.id)}
                              type="button"
                              className="button action-button create-button nbr"
                              title="Habilitar usuário"
                            >
                              <i className="bi bi-check-circle" />
                            </button>
                          )}
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
        </AccordionDetails>
      </Accordion>
      <Modal open={openModal} onClose={handleToggleModal} className="modal-container">
        <Box className="modal-content">
          <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
            <div className="div-input-formulario">
              <span>Nome</span>
              <Controller
                name="usuarioResponsavel"
                control={control}
                rules={{ required: "Campo obrigatório" }}
                render={({ field }) => (
                  <select
                    id="responsavel"
                    className={`input-formulario ${errors.usuarioResponsavel ? "input-error" : ""}`}
                    {...field}
                    value={field.value?.id || ""}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const selectedUser = usuariosResponsaveis.find((u) => u.id === selectedId) || null;

                      field.onChange(selectedUser);
                    }}
                  >
                    <option value="" key={"key-responsavel"}>
                      Selecione um nome
                    </option>
                    {usuariosResponsaveis
                      .filter((u) => u.email !== null && u.area !== null)
                      .map((u) => (
                        <option key={u.nome + u.id} value={u.id}>
                          {u.nome}
                        </option>
                      ))}
                  </select>
                )}
              />
              <div className="invalid-feedback d-block div-erro">{errors.usuarioResponsavel?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>E-mail</span>
              <div className="input-email-wrapper">
                <input
                  type="text"
                  className={`input-formulario input-email-com-sufixo ${errors.email ? "input-error" : ""}`}
                  {...register("email", {
                    required: "Campo obrigatório",
                    pattern: {
                      value: /^[A-Za-z]+$/,
                      message: "Use apenas letras (sem @, números ou símbolos)",
                    },
                  })}
                  maxLength={255}
                />
                <div className="sufixo-email-ctcea">
                  <span>@ctcea.org.br</span>
                </div>
              </div>
              <div className="invalid-feedback d-block div-erro">{errors.email?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>Login</span>
              <input
                type="text"
                className={`input-formulario disabled-field ${errors.login ? "input-error" : ""}`}
                {...register("login")}
                value={emailValue}
                disabled={true}
              />
              <div className="invalid-feedback d-block div-erro">{errors.login?.message}</div>
            </div>
            {!isEditing && (
              <>
                <div className="div-input-formulario">
                  <span>Senha</span>
                  <input
                    type="password"
                    className={`input-formulario ${errors.senha ? "input-error" : ""}`}
                    {...register("senha", { required: "Campo obrigatório" })}
                    maxLength={255}
                  />
                  <div className="invalid-feedback d-block div-erro">{errors.senha?.message}</div>
                </div>
              </>
            )}
            <div className="div-input-formulario">
              <span>Perfil</span>
              <Controller
                name="perfilUsuario"
                control={control}
                rules={{ required: "Campo obrigatório" }}
                render={({ field }) => (
                  <select
                    id="perfil"
                    className={`input-formulario ${errors.perfilUsuario ? "input-error" : ""}`}
                    {...field}
                    value={field.value.id}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      field.onChange({ id, autorizacao: "" });
                    }}
                  >
                    <option value="" key={"key-perfil"}>
                      Selecione um perfil
                    </option>
                    {isAdmin && (
                      <option key={"perfil-" + 1} value={1}>
                        Administrador de Sistema
                      </option>
                    )}
                    <option key={"perfil-" + 2} value={2}>
                      Administrador de Termo de Parceria
                    </option>
                    <option key={"perfil-" + 3} value={3}>
                      Usuário do Sistema
                    </option>
                  </select>
                )}
              />
              <div className="invalid-feedback d-block">{errors.perfilUsuario?.message}</div>
            </div>
            {!isAdminTp && (
              <div className="div-input-formulario">
                <span>Termo de Parceria</span>
                <Controller
                  name="termoParceria"
                  control={control}
                  rules={{ required: "Campo obrigatório" }}
                  render={({ field }) => (
                    <select id="termo-parceria" className={`input-formulario ${errors.termoParceria ? "input-error" : ""}`} {...field}>
                      <option value="" key={"key-termo-parceria"}>
                        Selecione um termo de parceria
                      </option>
                      <option value={"CCOMGEX"} key={"CCOMGEX"}>
                        CCOMGEX
                      </option>
                      <option value={"DECEA"} key={"DECEA"}>
                        DECEA
                      </option>
                      <option value={"CISCEA"} key={"CISCEA"}>
                        CISCEA
                      </option>
                      <option value={"PAME"} key={"PAME"}>
                        PAME
                      </option>
                      <option value={"MATRIZ"} key={"MATRIZ"}>
                        ADMINISTRAÇÃO CENTRAL
                      </option>
                    </select>
                  )}
                />
                <div className="invalid-feedback d-block div-erro">{errors.termoParceria?.message}</div>
              </div>
            )}
            <div className="div-input-formulario"></div>
            {loading ? (
              <div className="loading-div">
                <Loader />
              </div>
            ) : (
              <div className="form-buttons">
                <button type="submit" className="button submit-button">
                  Salvar
                </button>
              </div>
            )}
          </form>
        </Box>
      </Modal>
    </div>
  );
};

export default GerenciarUsuario;
