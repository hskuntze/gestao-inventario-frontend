import "./styles.css";
import { Accordion, AccordionDetails, AccordionSummary, Box, Modal, TablePagination } from "@mui/material";
import { useEffect, useState } from "react";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import { Controller, useForm } from "react-hook-form";
import { FornecedorType } from "@/types/fornecedor";
import { ContratoType } from "@/types/contrato";
import { fetchAllFornecedores, formatarData } from "@/utils/functions";
import Loader from "../Loader";
import { getUserData } from "@/utils/storage";

type FormData = {
  prefixoTipoContrato: string;
  objetoContrato: string;
  numeroContrato: string;
  descricao: string;
  termoParceria: string;
  inicioDataVigencia: string;
  fimDataVigencia: string;
  fornecedor: FornecedorType | null;
};

const GerenciarContrato = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [contratos, setContratos] = useState<ContratoType[]>([]);
  const [filter, setFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [contratoId, setContratoId] = useState<number>();

  const [fornecedores, setFornecedores] = useState<FornecedorType[]>([]);

  const user = getUserData();

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    watch,
    reset,
  } = useForm<FormData>();

  const dataMinima = new Date("2003-11-04");
  const inicioVigencia = watch("inicioDataVigencia");

  const filteredData = contratos.filter((c) => {
    const searchTerm = filter.trim();
    if (!searchTerm) return true;

    return (
      c.numeroContrato.toLowerCase().includes(searchTerm) ||
      (c.objetoContrato.toLowerCase().includes(searchTerm) ?? false) ||
      (c.termoParceria.toLowerCase().includes(searchTerm) ?? false) ||
      (formatarData(c.inicioDataVigencia).includes(searchTerm) ?? false) ||
      (formatarData(c.fimDataVigencia).includes(searchTerm) ?? false)
    );
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const loadContratos = () => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/contratos/all",
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        let data = res.data as ContratoType[];
        setContratos(data);
      })
      .catch((err) => {
        toast.error("Erro ao tentar carregar os contratos. Erro: " + err.data.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onSubmit = (formData: FormData) => {
    let numeroContrato = formData.prefixoTipoContrato + formData.numeroContrato;

    const requestParams: AxiosRequestConfig = {
      url: isEditing ? `/contratos/update/${contratoId}` : "/contratos/register",
      method: isEditing ? "PUT" : "POST",
      withCredentials: true,
      data: {
        numeroContrato: numeroContrato,
        objetoContrato: formData.objetoContrato,
        descricao: formData.descricao,
        inicioDataVigencia: formData.inicioDataVigencia,
        fimDataVigencia: formData.fimDataVigencia,
        termoParceria: user.termoParceria,
        fornecedor: formData.fornecedor,
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success(`Contrato ${isEditing ? "editado" : "criado"} com sucesso.`);
        loadContratos();
        setOpenModal(false);
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Erro ao tentar atualizar o contrato.";
        toast.error(message);
      })
      .finally(() => {});
  };

  const handleDeleteContrato = (id: number) => {
    let confirm = window.confirm("Esta é uma operação irreversível. Tem certeza que deseja excluir este contrato?");

    if (confirm) {
      const requestParams: AxiosRequestConfig = {
        url: `/contratos/delete/${id}`,
        method: "DELETE",
        withCredentials: true,
      };

      requestBackend(requestParams)
        .then((res) => {
          toast.success("Deletado com sucesso.");
          loadContratos();
        })
        .catch(() => {})
        .finally(() => {});
    }
  };

  const handleDisableContrato = (id: number) => {
    let confirm = window.confirm("Esta é uma operação irreversível. Tem certeza que deseja desabilitar este contrato?");

    if (confirm) {
      const requestParams: AxiosRequestConfig = {
        url: `/contratos/desabilitar/${id}`,
        method: "POST",
        withCredentials: true,
      };

      requestBackend(requestParams)
        .then((res) => {
          toast.success("Desabilitado com sucesso.");
          loadContratos();
        })
        .catch(() => {})
        .finally(() => {});
    }
  };

  const handleEditContrato = (contrato: ContratoType) => {
    setOpenModal(true);
    setIsEditing(true);
    setContratoId(contrato.id);

    let lengthNumeroContrato = contrato.numeroContrato.length;
    let prefixo = contrato.numeroContrato.substring(0, 2);
    let numero = contrato.numeroContrato.substring(2, lengthNumeroContrato);

    setValue("prefixoTipoContrato", prefixo);
    setValue("numeroContrato", numero);
    setValue("objetoContrato", contrato.objetoContrato);
    setValue("descricao", contrato.descricao);
    setValue("fimDataVigencia", contrato.fimDataVigencia);
    setValue("inicioDataVigencia", contrato.inicioDataVigencia);
    setValue("termoParceria", contrato.termoParceria);
    setValue("fornecedor", contrato.fornecedor);
  };

  const handleToggleModal = () => {
    reset();
    setOpenModal(true);
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

  useEffect(() => {
    loadContratos();
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

  return (
    <div className="component-accordion" id="gerenciar-contrato">
      <Accordion
        classes={{
          root: "bg-card-blue content-container",
        }}
      >
        <AccordionSummary
          expandIcon={<i className="bi bi-chevron-down" />}
          aria-controls="gerenciar-contrato"
          id="gerenciar-contrato-header"
          className="accordion-title"
        >
          Contratos
        </AccordionSummary>
        <AccordionDetails>
          <div className="accordion-header">
            <div className="filtro-container">
              <div className="filtro-input-div form-floating">
                <i className="bi bi-search" />
                <input
                  type="text"
                  className="form-control filtro-input"
                  id="nome-contrato-filtro"
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
                Adicionar Contrato
              </button>
            </div>
          </div>
          <div className="div-table">
            <table className="contrato-list-table">
              <thead>
                <tr key={"tr-head-contrato-list-table"}>
                  <th scope="col">Número do Contrato</th>
                  <th scope="col">Objeto do Contrato</th>
                  <th scope="col">Início da vigência</th>
                  <th scope="col">Fim da vigência</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((a) => (
                    <tr key={a.id} className={`${a.desabilitado ? "tr-desabilitado" : ""}`}>
                      <td>
                        <div>{a.numeroContrato}</div>
                      </td>
                      <td>
                        <div>{a.objetoContrato}</div>
                      </td>
                      <td>
                        <div>{formatarData(a.inicioDataVigencia)}</div>
                      </td>
                      <td>
                        <div>{formatarData(a.fimDataVigencia)}</div>
                      </td>
                      <td>
                        <div className="table-action-buttons">
                          <button
                            disabled={a.desabilitado}
                            onClick={() => handleEditContrato(a)}
                            className={`button action-button nbr ${a.desabilitado ? "disabled-button" : ""}`}
                            title="Editar contrato"
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            disabled={a.desabilitado}
                            onClick={() => handleDisableContrato(a.id)}
                            type="button"
                            className={`button action-button delete-button nbr ${a.desabilitado ? "disabled-button" : ""}`}
                            title="Desabilitar fornecedor"
                          >
                            <i className="bi bi-x-circle" />
                          </button>
                          <button
                            disabled={a.desabilitado}
                            onClick={() => handleDeleteContrato(a.id)}
                            type="button"
                            className={`button action-button delete-button nbr ${a.desabilitado ? "disabled-button" : ""}`}
                            title="Excluir contrato"
                          >
                            <i className="bi bi-trash3" />
                          </button>
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
      <Modal open={openModal} onClose={() => setOpenModal(false)} className="modal-container">
        <Box className="modal-content">
          <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
            <div className="div-input-formulario">
              <div>
                <span>Número do contrato</span>
                <span className="obrigatorio-ast">*</span>
              </div>
              <div className="numero-contrato-wrapper">
                <div className="seletor-tipo-wrapper">
                  <Controller
                    name="prefixoTipoContrato"
                    control={control}
                    rules={{ required: "Selecione um tipo" }}
                    render={({ field }) => (
                      <select
                        className={`numero-contrato-prefixo ${errors.prefixoTipoContrato ? "input-error" : ""}`}
                        id="prefixo-numero-contrato"
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(e)}
                      >
                        <option value="">Tipo</option>
                        <option value="OS">OS</option>
                        <option value="AF">AF</option>
                        <option value="CT">CT</option>
                      </select>
                    )}
                  />
                  <div className="invalid-feedback d-block div-erro">{errors.prefixoTipoContrato?.message}</div>
                </div>
                <input
                  type="text"
                  className={`input-formulario numero-contrato-input ${errors.numeroContrato ? "input-error" : ""}`}
                  {...register("numeroContrato", {
                    required: "Campo obrigatório",
                    pattern: {
                      value: /^[0-9]{1,4}\/[0-9]{4}$/,
                      message: "Formato inválido. Use: 1/2025, 01/2025, 001/2025 ou 0001/2025",
                    },
                    onChange: (e) => {
                      let v = e.target.value;

                      // Remove tudo que não seja número ou "/"
                      v = v.replace(/[^0-9/]/g, "");

                      // Impede mais de uma barra
                      const partes = v.split("/");
                      if (partes.length > 2) {
                        v = partes[0] + "/" + partes[1]; // descarta barras extras
                      }

                      // Atualiza o valor limpo
                      e.target.value = v;
                    },
                  })}
                  maxLength={9}
                />
              </div>
              <div className="invalid-feedback d-block div-erro div-erro-numero-contrato">{errors.numeroContrato?.message}</div>
            </div>
            <div className="div-input-formulario">
              <div>
                <span>Fornecedor</span>
                <span className="obrigatorio-ast">*</span>
              </div>
              <Controller
                name="fornecedor"
                control={control}
                rules={{ required: "Campo obrigatório" }}
                render={({ field }) => (
                  <select
                    id="fornecedor"
                    className={`input-formulario ${errors.fornecedor ? "input-error" : ""}`}
                    {...field}
                    value={fornecedores.find((f) => f.id === field.value?.id)?.id || ""}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const selectedFornecedor = fornecedores.find((f) => f.id === selectedId);
                      field.onChange(selectedFornecedor || "");
                    }}
                  >
                    <option value="">Selecione um fornecedor</option>
                    {fornecedores.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                )}
              />
              <div className="invalid-feedback d-block div-erro">{errors.fornecedor?.message}</div>
            </div>
            <div className="div-input-formulario">
              <div>
                <span>Início da vigência</span>
                <span className="obrigatorio-ast">*</span>
              </div>
              <input
                type="date"
                className={`input-formulario data-input ${errors.inicioDataVigencia ? "input-error" : ""}`}
                min={"2003-11-04"}
                {...register("inicioDataVigencia", {
                  required: "Campo obrigatório",
                  validate: (value) => {
                    const data = new Date(value);

                    if (isNaN(data.getTime())) return "Data inválida";
                    if (data < dataMinima) return "A data mínima permitida é 04/11/2003";

                    return true;
                  },
                })}
              />
              <div className="invalid-feedback d-block div-erro">{errors.inicioDataVigencia?.message}</div>
            </div>
            <div className="div-input-formulario">
              <div>
                <span>Fim da vigência</span>
                <span className="obrigatorio-ast">*</span>
              </div>
              <input
                type="date"
                className={`input-formulario data-input ${errors.fimDataVigencia ? "input-error" : ""}`}
                min={"2003-11-05"}
                {...register("fimDataVigencia", {
                  required: "Campo obrigatório",
                  validate: (value) => {
                    const inicio = new Date(inicioVigencia);
                    const fim = new Date(value);

                    if (isNaN(fim.getTime())) return "Data inválida";
                    if (isNaN(inicio.getTime())) return "Preencha a data de início";
                    if (fim <= inicio) return "A data final deve ser pelo menos 1 dia após a data de início";

                    return true;
                  },
                })}
              />
              <div className="invalid-feedback d-block div-erro">{errors.fimDataVigencia?.message}</div>
            </div>
            <div className="div-input-formulario">
              <div>
                <span>Objeto do Contrato</span>
                <span className="obrigatorio-ast">*</span>
              </div>
              <textarea
                id="objetoContrato"
                className={`input-formulario input-textarea-formulario ${errors.objetoContrato ? "input-error" : ""}`}
                {...register("objetoContrato", { required: "Campo obrigatório" })}
                maxLength={255}
                style={{ paddingTop: 5 }}
              ></textarea>
              <div className="invalid-feedback d-block div-erro">{errors.objetoContrato?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>Observação</span>
              <textarea
                id="descricao"
                className={`input-formulario input-textarea-formulario ${errors.descricao ? "input-error" : ""}`}
                {...register("descricao")}
                maxLength={255}
                style={{ paddingTop: 5 }}
              ></textarea>
              <div className="invalid-feedback d-block div-erro">{errors.descricao?.message}</div>
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

export default GerenciarContrato;
