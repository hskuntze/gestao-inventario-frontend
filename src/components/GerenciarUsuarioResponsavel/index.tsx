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
import { Perfil } from "@/types/perfil";
import { getUserData } from "@/utils/storage";
import { hasAnyRoles } from "@/utils/auth";
import { User } from "@/types/user";

type FormData = {
  nome: string;
  email: string;
  login: string;
  area: SetorType; //área = setor (mudança de nomenclatura)
  perfilUsuario: Perfil;
  termoParceria: string;
};

interface Props {
  reloadPage: () => void;
}

/**
 * O conceito de "Usuário" e "Usuário Responsável" são diferentes, mas complementares. A princípio, não haveria necessidade de
 * cadastrar usuários de sistema, uma vez que estes viriam do AD do TP/CCOMGEX. Como houve mudança de escopo para que atendesse
 * outros TPs, a ideia de integrar ao AD ficou para posterioridade. Portanto como essas classes já estavam implementadas no back-end
 * houve apenas uma adaptação para a nova lógica.
 *
 * Conforme o andar do projeto, novas mudanças foram definidas e os conceitos foram (de um modo ou de outro) unificados.
 *
 * A nível de relação em banco de dados: Usuário 1-1 Usuário Responsável
 * @returns
 */
const GerenciarUsuarioResponsavel = ({ reloadPage }: Props) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [usuariosSistema, setUsuariosSistema] = useState<User[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResponsavelType[]>([]);
  const [filter, setFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [usuarioId, setUsuarioId] = useState<number>();

  const [setores, setSetores] = useState<SetorType[]>([]);

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminTp, setIsAdminTp] = useState<boolean>(false);

  // Dados do usuário logado
  const user = getUserData();

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
      perfilUsuario: { id: -1, autorizacao: "" },
      termoParceria: "",
    },
  });

  const emailValue = watch("email");

  const handleToggleModal = () => {
    reset();
    setOpenModal(true);
  };

  // ------- PAGINAÇÃO -------
  const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, pageNumber: number) => {
    setPage(pageNumber);
  };

  // ------- PAGINAÇÃO -------
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ------- PAGINAÇÃO/FILTRO -------
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value.toLowerCase());
    setPage(0);
  };

  // ------- FILTRO -------
  const filteredData = usuarios.filter((u) => {
    const searchTerm = filter.trim();
    if (!searchTerm) return true;

    return (
      u.nome.toLowerCase().includes(searchTerm ?? false) ||
      ((u.email ?? "-").toLowerCase().includes(searchTerm) ?? false) ||
      ((u.area ? u.area.nome : "-").toLowerCase().includes(searchTerm) ?? false)
    );
  });

  // ------- LISTAGEM DOS DADOS NA TABELA -------
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

  const loadUsuariosSistema = () => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/usuarios/all",
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        let data = res.data as User[];
        setUsuariosSistema(data);
      })
      .catch((err) => {
        toast.error("Erro ao tentar carregar os usuários. Erro: " + err.data.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  /**
   * Função para tratar dos dados de usuário de sistema
   * @param formData FormData
   * @param nome string
   * @param email string
   * @param usuarioResponsavelId number
   * @param editando boolean
   * @param usuario opcional, User
   */
  const submitUsuarioSistema = (formData: FormData, nome: string, email: string, usuarioResponsavelId: number, editando: boolean, usuario?: User) => {
    const requestParams: AxiosRequestConfig = {
      url: editando ? `/usuarios/update/${usuario?.id}` : "/usuarios/register",
      method: editando ? "PUT" : "POST",
      withCredentials: true,
      data: {
        nome: nome,
        email: email,
        login: formData.login,
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
        toast.success(`Usuário ${isEditing ? "editado" : "criado"} com sucesso.`);
        // loadUsuarios();
        // loadUsuariosSistema();
        setOpenModal(false);
        reloadPage();
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Erro ao tentar atualizar o usuário do sistema.";
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  /**
   * Função para tratar dos dados de usuário responsável (associados aos ativos)
   * @param formData
   */
  const onSubmit = (formData: FormData) => {
    setLoading(true);

    let nome = formData.nome.trim().toUpperCase();
    let email = formData.email + "@ctcea.org.br";

    const requestParams: AxiosRequestConfig = {
      url: isEditing ? `/usuarios/responsaveis/update/${usuarioId}` : "/usuarios/responsaveis/register",
      method: isEditing ? "PUT" : "POST",
      withCredentials: true,
      data: {
        nome: nome,
        email: email,
        area: {
          id: formData.area.id,
        },
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        let data = res.data as UsuarioResponsavelType;

        /**
         * Esse tratamento serve para os casos em que há carga de usuários no sistema.
         * Se a inserção fosse feita unicamente pelo sistema não haveria necessidade dessa verificação,
         * mas precisamos levar em consideração a necessidade de dar uma carga inicial no sistema pela
         * grande quantidade de funcionários em alguns termos de parceria.
         */
        let usuarioSistemaExists = usuariosSistema.find((us) => us.email === data.email); // Verifica se o usuário resp. existe dentre os usuários de sistema
        let editando = usuarioSistemaExists ? true : false; // Se existir, então estamos tratando de uma edição, caso contrário ele vai ser inserido no sistema

        submitUsuarioSistema(formData, nome, email, data.id, editando, usuarioSistemaExists);
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Erro ao tentar atualizar o usuário responsável.";
        toast.error(message);
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
          reloadPage();
        })
        .catch((err) => {})
        .finally(() => {});
    }
  };

  /**
   * Função responsável por desabilitar um usuário dentro do sistema
   * @param id
   */
  const handleDisableUser = (email: string) => {
    let confirm = window.confirm("Deseja desabilitar este usuário?");

    if (confirm) {
      let usuarioSistema = usuariosSistema.find((us) => us.email === email);

      if (usuarioSistema) {
        const requestParams: AxiosRequestConfig = {
          url: "/usuarios/operacao/desabilitar",
          method: "POST",
          withCredentials: true,
          params: {
            userId: usuarioSistema.id,
          },
        };

        requestBackend(requestParams)
          .then(() => {
            toast.success("Usuário desabilitado.");
            reloadPage();
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
      } else {
        toast.info("Usuário ainda não está cadastrado no sistema para que possa ser desabilitado.");
      }
    }
  };

  const handleMudarSenha = (email: string) => {
    let confirm = window.confirm("Tem certeza que deseja disparar o e-mail de recuperação de senha?");

    if (confirm) {
      setLoading(true);
      let usuarioSistema = usuariosSistema.find((us) => us.email === email);

      if (usuarioSistema) {
        const requestParams: AxiosRequestConfig = {
          url: `/usuarios/password/recover/user/${usuarioSistema.id}`,
          method: "POST",
          withCredentials: true,
        };

        requestBackend(requestParams)
          .then(() => {
            toast.success("E-mail para recuperação de senha enviado.");
          })
          .catch((err) => {
            let message = err.response.data.message;
            if (message) {
              toast.error(message);
            } else {
              toast.error("Erro ao tentar disparar e-mail de recuperação de senha.");
            }
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        toast.info("Usuário ainda não está cadastrado no sistema para que possa ser desabilitado.");
      }
    }
  };

  /**
   * Função para abrir a edição do usuário. Alguns dados vão ser preenchidos pelo "UsuarioResponsavelType"
   * e outros serão pelo "User". Por exemplo, "Area"/"Setor" é uma informação que existe no "Usuário Responsável".
   * @param u
   */
  const handleEditUsuarioResponsavel = (u: UsuarioResponsavelType) => {
    setIsEditing(true);
    setUsuarioId(u.id);

    let us = usuariosSistema.find((value) => value.email === u.email);

    let atIndex = u.email.indexOf("@");
    let email = u.email.substring(0, atIndex);

    if (us) {
      setValue("perfilUsuario", us.perfis[0]);
      setValue("termoParceria", us.termoParceria);
      setValue("nome", u.nome);
      setValue("email", email);
      setValue("login", email);
      setValue("area", u.area);
    } else {
      reset({
        perfilUsuario: { id: -1, autorizacao: "" },
        termoParceria: undefined,
      });
      setValue("nome", u.nome);
      setValue("email", email);
      setValue("login", email);
      setValue("area", u.area);
    }

    setOpenModal(true);
  };

  useEffect(() => {
    loadUsuariosSistema();
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

  useEffect(() => {
    setIsAdmin(hasAnyRoles([{ id: 1, autorizacao: "PERFIL_ADMIN" }]));
  }, []);

  useEffect(() => {
    setIsAdminTp(hasAnyRoles([{ id: 2, autorizacao: "PERFIL_ADMIN_TP" }]));
  }, []);

  useEffect(() => {
    setValue("login", emailValue || "", { shouldValidate: true });
  }, [emailValue, setValue]);

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
          Usuários
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
              <button
                onClick={() => {
                  handleToggleModal();
                  setIsEditing(false);
                }}
                type="button"
                className="button submit-button auto-width pd-2"
              >
                <i className="bi bi-plus" />
                Adicionar Usuário
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
                    <tr key={a.id} className={`${a.desabilitado ? "tr-desabilitado" : ""}`}>
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
                            disabled={a.desabilitado}
                            onClick={() => handleMudarSenha(a.email)}
                            className={`button action-button nbr ${a.desabilitado ? "disabled-button" : ""}`}
                            title="Mudar senha"
                          >
                            <i className="bi bi-key" />
                          </button>
                          <button
                            disabled={a.desabilitado}
                            onClick={() => handleEditUsuarioResponsavel(a)}
                            className={`button action-button nbr ${a.desabilitado ? "disabled-button" : ""}`}
                            title="Editar usuário responsável"
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            disabled={a.desabilitado}
                            onClick={() => handleDisableUser(a.email)}
                            type="button"
                            className={`button action-button delete-button nbr ${a.desabilitado ? "disabled-button" : ""}`}
                            title="Desabilitar usuário"
                          >
                            <i className="bi bi-x-circle" />
                          </button>
                          <button
                            disabled={a.desabilitado}
                            onClick={() => handleDeleteUsuarioResponsavel(a.id)}
                            type="button"
                            className={`button action-button delete-button nbr ${a.desabilitado ? "disabled-button" : ""}`}
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
      <Modal open={openModal} onClose={() => setOpenModal(false)} className="modal-container">
        <Box className="modal-content">
          <form className="formulario" onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <div className="div-input-formulario">
              <div>
                <span>Nome</span>
                <span className="obrigatorio-ast">*</span>
              </div>
              <input
                type="text"
                className={`input-formulario ${errors.nome ? "input-error" : ""}`}
                {...register("nome", { required: "Campo obrigatório" })}
                maxLength={255}
                autoComplete="off"
              />
              <div className="invalid-feedback d-block div-erro">{errors.nome?.message}</div>
            </div>
            <div className="div-input-formulario">
              <div>
                <span>E-mail</span>
                <span className="obrigatorio-ast">*</span>
              </div>
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
                  autoComplete="off"
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
            <div className="div-input-formulario">
              <div>
                <span>Perfil</span>
                <span className="obrigatorio-ast">*</span>
              </div>
              <Controller
                name="perfilUsuario"
                control={control}
                rules={{
                  validate: (v) => v.id !== -1 || "Campo obrigatório",
                }}
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
                      Analista de Inventário
                    </option>
                    <option key={"perfil-" + 3} value={3}>
                      Gerente
                    </option>
                    <option key={"perfil-" + 4} value={4}>
                      Usuário do Sistema
                    </option>
                  </select>
                )}
              />
              <div className="invalid-feedback d-block div-erro">{errors.perfilUsuario?.message}</div>
            </div>
            {!isAdminTp && (
              <div className="div-input-formulario">
                <div>
                  <span>Termo de Parceria</span>
                  <span className="obrigatorio-ast">*</span>
                </div>
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
              <div className="form-bottom">
                <div className="legenda">* Campos obrigatórios</div>
                <div className="form-buttons">
                  <button className="button submit-button">Salvar</button>
                </div>
              </div>
            )}
          </form>
        </Box>
      </Modal>
    </div>
  );
};

export default GerenciarUsuarioResponsavel;
