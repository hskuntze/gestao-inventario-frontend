import "./styles.css";
import { Accordion, AccordionDetails, AccordionSummary, Box, Modal, TablePagination } from "@mui/material";
import { useEffect, useState } from "react";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { FornecedorType } from "@/types/fornecedor";
import Loader from "../Loader";

type FormData = {
  nome: string;
  contatoEmail: string;
  contatoNome: string;
  contatoTelefone: string;
  cnpj: string;
};

const GerenciarFornecedor = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [fornecedor, setFornecedor] = useState<FornecedorType[]>([]);
  const [filter, setFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [fornecedorId, setFornecedorId] = useState<number>();

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<FormData>();

  const handleToggleModal = () => {
    setOpenModal(!openModal);

    setValue("nome", "");
    setValue("cnpj", "");
    setValue("contatoEmail", "");
    setValue("contatoNome", "");
    setValue("contatoTelefone", "");
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

  const filteredData = fornecedor.filter((f) => {
    const searchTerm = filter.trim();
    if (!searchTerm) return true;

    return (
      f.nome.toLowerCase().includes(searchTerm) ||
      (f.cnpj.toLowerCase().includes(searchTerm) ?? false) ||
      (f.contatoNome.toLowerCase().includes(searchTerm) ?? false) ||
      (f.contatoEmail.toLowerCase().includes(searchTerm) ?? false) ||
      (f.contatoTelefone.toLowerCase().includes(searchTerm) ?? false)
    );
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const loadFornecedores = () => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/fornecedores/all",
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        let data = res.data as FornecedorType[];
        setFornecedor(data);
      })
      .catch((err) => {
        toast.error("Erro ao tentar carregar os fornecedores. Erro: " + err.data.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onSubmit = (formData: FormData) => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: isEditing ? `/fornecedores/update/${fornecedorId}` : "/fornecedores/register",
      method: isEditing ? "PUT" : "POST",
      withCredentials: true,
      data: {
        nome: formData.nome,
        cnpj: formData.cnpj,
        contatoNome: formData.contatoNome,
        contatoEmail: formData.contatoEmail,
        contatoTelefone: formData.contatoTelefone,
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success(`Fornecedor ${isEditing ? "editado" : "criado"} com sucesso.`);
        loadFornecedores();
        handleToggleModal();
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Erro ao tentar atualizar o fornecedor.";
        toast.error(message);
        handleToggleModal();
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDeleteFornecedor = (id: number) => {
    let confirm = window.confirm("Esta é uma operação irreversível. Tem certeza que deseja excluir este fornecedor?");

    if (confirm) {
      const requestParams: AxiosRequestConfig = {
        url: `/fornecedores/delete/${id}`,
        method: "DELETE",
        withCredentials: true,
      };

      requestBackend(requestParams)
        .then((res) => {
          toast.success("Deletado com sucesso.");
          loadFornecedores();
        })
        .catch((err) => {})
        .finally(() => {});
    }
  };

  const handleEditFornecedor = (f: FornecedorType) => {
    setOpenModal(true);
    setIsEditing(true);
    setFornecedorId(f.id);

    setValue("nome", f.nome);
    setValue("contatoEmail", f.contatoEmail);
    setValue("contatoNome", f.contatoNome);
    setValue("contatoTelefone", f.contatoTelefone);
    setValue("cnpj", f.cnpj);
  };

  useEffect(() => {
    loadFornecedores();
  }, []);

  return (
    <div className="component-accordion" id="gerenciar-fornecedor">
      <Accordion
        classes={{
          root: "bg-card-blue content-container",
        }}
      >
        <AccordionSummary
          expandIcon={<i className="bi bi-chevron-down" />}
          aria-controls="gerenciar-fornecedor"
          id="gerenciar-fornecedor-header"
          className="accordion-title"
        >
          Fornecedores
        </AccordionSummary>
        <AccordionDetails>
          <div className="accordion-header">
            <div className="filtro-container">
              <div className="filtro-input-div form-floating">
                <i className="bi bi-search" />
                <input
                  type="text"
                  className="form-control filtro-input"
                  id="fornecedor-filtro"
                  placeholder="Digite um termo para filtrar"
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div>
              <button onClick={handleToggleModal} type="button" className="button submit-button auto-width pd-2">
                <i className="bi bi-plus" />
                Adicionar Fornecedor
              </button>
            </div>
          </div>
          <div className="div-table">
            <table className="fornecedor-list-table">
              <thead>
                <tr key={"tr-head-fornecedor-list-table"}>
                  <th scope="col">Nome</th>
                  <th scope="col">CNPJ</th>
                  <th scope="col">Contato nome</th>
                  <th scope="col">Contato e-mail</th>
                  <th scope="col">Contato telefone</th>
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
                        <div>{a.cnpj ?? "-"}</div>
                      </td>
                      <td>
                        <div>{a.contatoNome ?? "-"}</div>
                      </td>
                      <td>
                        <div>{a.contatoEmail ?? "-"}</div>
                      </td>
                      <td>
                        <div>{a.contatoTelefone ?? "-"}</div>
                      </td>
                      <td>
                        <div className="table-action-buttons">
                          <button onClick={() => handleEditFornecedor(a)} className="button action-button nbr" title="Editar fornecedor">
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            onClick={() => handleDeleteFornecedor(a.id)}
                            type="button"
                            className="button action-button delete-button nbr"
                            title="Excluir fornecedor"
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="no-data-on-table" colSpan={6}>
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
              <span>CNPJ</span>
              <input
                type="text"
                className={`input-formulario ${errors.cnpj ? "input-error" : ""}`}
                {...register("cnpj", { required: "Campo obrigatório" })}
                maxLength={255}
              />
              <div className="invalid-feedback d-block div-erro">{errors.cnpj?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>Contato nome</span>
              <input
                type="text"
                className={`input-formulario ${errors.contatoNome ? "input-error" : ""}`}
                {...register("contatoNome", { required: "Campo obrigatório" })}
                maxLength={255}
              />
              <div className="invalid-feedback d-block div-erro">{errors.contatoNome?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>Contato e-mail</span>
              <input
                type="text"
                className={`input-formulario ${errors.contatoEmail ? "input-error" : ""}`}
                {...register("contatoEmail", { required: "Campo obrigatório" })}
                maxLength={255}
              />
              <div className="invalid-feedback d-block div-erro">{errors.contatoEmail?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>Contato telefone</span>
              <input
                type="text"
                className={`input-formulario ${errors.contatoTelefone ? "input-error" : ""}`}
                {...register("contatoTelefone", { required: "Campo obrigatório" })}
                maxLength={255}
              />
              <div className="invalid-feedback d-block div-erro">{errors.contatoTelefone?.message}</div>
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

export default GerenciarFornecedor;
