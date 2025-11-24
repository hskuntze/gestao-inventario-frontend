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

type FormData = {
  titulo: string;
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

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<FormData>();

  const handleToggleModal = () => {
    setOpenModal(!openModal);

    setValue("titulo", "");
    setValue("descricao", "");
    setValue("termoParceria", "");
    setValue("inicioDataVigencia", "");
    setValue("fimDataVigencia", "");
    setValue("fornecedor", null);
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

  const filteredData = contratos.filter((c) => {
    const searchTerm = filter.trim();
    if (!searchTerm) return true;

    return (
      c.titulo.toLowerCase().includes(searchTerm) ||
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
    const requestParams: AxiosRequestConfig = {
      url: isEditing ? `/contratos/update/${contratoId}` : "/contratos/register",
      method: isEditing ? "PUT" : "POST",
      withCredentials: true,
      data: {
        titulo: formData.titulo,
        descricao: formData.descricao,
        inicioDataVigencia: formData.inicioDataVigencia,
        fimDataVigencia: formData.fimDataVigencia,
        termoParceria: formData.termoParceria,
        fornecedor: formData.fornecedor,
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success(`Contrato ${isEditing ? "editado" : "criado"} com sucesso.`);
        loadContratos();
        handleToggleModal();
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

  const handleEditContrato = (contrato: ContratoType) => {
    setOpenModal(true);
    setIsEditing(true);
    setContratoId(contrato.id);

    setValue("titulo", contrato.titulo);
    setValue("descricao", contrato.descricao);
    setValue("fimDataVigencia", contrato.fimDataVigencia);
    setValue("inicioDataVigencia", contrato.inicioDataVigencia);
    setValue("termoParceria", contrato.termoParceria);
    setValue("fornecedor", contrato.fornecedor);
  };

  useEffect(() => {
    loadContratos();
  }, []);

  useEffect(() => {
    async function getFornecedores() {
      setFornecedores([]);

      try {
        const data = (await fetchAllFornecedores()) as FornecedorType[];
        setFornecedores(data);
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
              <button onClick={handleToggleModal} type="button" className="button submit-button auto-width pd-2">
                <i className="bi bi-plus" />
                Adicionar Contrato
              </button>
            </div>
          </div>
          <div className="div-table">
            <table className="contrato-list-table">
              <thead>
                <tr key={"tr-head-contrato-list-table"}>
                  <th scope="col">Título</th>
                  <th scope="col">Termo de Parceria</th>
                  <th scope="col">Início da vigência</th>
                  <th scope="col">Fim da vigência</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div>{a.titulo}</div>
                      </td>
                      <td>
                        <div>{a.termoParceria}</div>
                      </td>
                      <td>
                        <div>{formatarData(a.inicioDataVigencia)}</div>
                      </td>
                      <td>
                        <div>{formatarData(a.fimDataVigencia)}</div>
                      </td>
                      <td>
                        <div className="table-action-buttons">
                          <button onClick={() => handleEditContrato(a)} className="button action-button nbr" title="Editar contrato">
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            onClick={() => handleDeleteContrato(a.id)}
                            type="button"
                            className="button action-button delete-button nbr"
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
              <span>Título do contrato</span>
              <input
                type="text"
                className={`input-formulario ${errors.titulo ? "input-error" : ""}`}
                {...register("titulo", { required: "Campo obrigatório" })}
                maxLength={255}
              />
              <div className="invalid-feedback d-block div-erro">{errors.titulo?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>Fornecedor</span>
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
              <span>Início da vigência</span>
              <input
                type="date"
                className={`input-formulario data-input ${errors.inicioDataVigencia ? "input-error" : ""}`}
                {...register("inicioDataVigencia", { required: "Campo obrigatório" })}
              />
              <div className="invalid-feedback d-block div-erro">{errors.inicioDataVigencia?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>Fim da vigência</span>
              <input
                type="date"
                className={`input-formulario data-input ${errors.fimDataVigencia ? "input-error" : ""}`}
                {...register("fimDataVigencia", { required: "Campo obrigatório" })}
              />
              <div className="invalid-feedback d-block div-erro">{errors.fimDataVigencia?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>Termo de Parceria</span>
              <Controller
                name="termoParceria"
                control={control}
                rules={{ required: "Campo obrigatório" }}
                render={({ field }) => (
                  <select id="responsavel" className={`input-formulario ${errors.termoParceria ? "input-error" : ""}`} {...field}>
                    <option value="">Selecione um responsável</option>
                    <option value={"CCOMGEX"}>CCOMGEX</option>
                    <option value={"DECEA"}>DECEA</option>
                    <option value={"CISCEA"}>CISCEA</option>
                    <option value={"PAME"}>PAME</option>
                    <option value={"MATRIZ"}>ADMINISTRAÇÃO CENTRAL</option>
                  </select>
                )}
              />
              <div className="invalid-feedback d-block div-erro">{errors.termoParceria?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>Descrição</span>
              <textarea
                id="descricao"
                className={`input-formulario ${errors.descricao ? "input-error" : ""}`}
                rows={4}
                {...register("descricao", { required: "Campo obrigatório" })}
                maxLength={255}
                style={{ paddingTop: 5 }}
              ></textarea>
              <div className="invalid-feedback d-block div-erro">{errors.descricao?.message}</div>
            </div>
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

export default GerenciarContrato;
