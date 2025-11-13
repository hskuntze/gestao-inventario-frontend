import "./styles.css";
import { Accordion, AccordionDetails, AccordionSummary, Box, Modal, TablePagination } from "@mui/material";
import { useEffect, useState } from "react";
import { AreaType } from "@/types/area";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import { LocalizacaoType } from "@/types/localizacao";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { UsuarioResponsavelType } from "@/types/usuario_responsavel";
import { fetchAllUsuariosResponsaveis } from "@/utils/functions";

type FormData = {
  nome: string;
  responsavel: string;
  substitutoResponsavel: string;
  localizacoes: LocalizacaoType[];
};

const GerenciarArea = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [areas, setAreas] = useState<AreaType[]>([]);
  const [_reload, _setReload] = useState<boolean>(false);
  const [filter, setFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [areaId, setAreaId] = useState<number>();

  const [usuariosResponsaveis, setUsuariosResponsaveis] = useState<UsuarioResponsavelType[]>([]);

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      localizacoes: [{ nome: "" }],
    },
  });

  const {
    append: appendLoc,
    fields: locFields,
    remove: removeLoc,
  } = useFieldArray<FormData, "localizacoes">({
    control,
    name: "localizacoes",
  });

  const handleToggleModal = () => {
    setOpenModal(!openModal);

    setValue("nome", "");
    setValue("responsavel", "");
    setValue("substitutoResponsavel", "");
    setValue("localizacoes", []);
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

  const filteredData = areas.filter((a) => {
    const searchTerm = filter.trim();
    if (!searchTerm) return true;

    return (
      a.nome.toLowerCase().includes(searchTerm) ||
      (a.responsavel.toLowerCase().includes(searchTerm) ?? false) ||
      (a.substitutoResponsavel.toLowerCase().includes(searchTerm) ?? false)
    );
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const loadAreas = () => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/areas/all",
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        let data = res.data as AreaType[];
        setAreas(data);
      })
      .catch((err) => {
        toast.error("Erro ao tentar carregar as áreas. Erro: " + err.data.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onSubmit = (formData: FormData) => {
    const requestParams: AxiosRequestConfig = {
      url: isEditing ? `/areas/update/${areaId}` : "/areas/register",
      method: isEditing ? "PUT" : "POST",
      withCredentials: true,
      data: {
        nome: formData.nome,
        responsavel: formData.responsavel,
        substitutoResponsavel: formData.substitutoResponsavel,
        localizacoes: formData.localizacoes.map((loc) => ({
          id: loc.id,
          nome: loc.nome,
        })),
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success(`Área ${isEditing ? "editada" : "criada"} com sucesso.`);
        loadAreas();
        handleToggleModal();
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Erro ao tentar atualizar a área.";
        toast.error(message);
        handleToggleModal();
      })
      .finally(() => {});
  };

  const handleDeleteArea = (id: number) => {};

  const handleEditArea = (area: AreaType) => {
    setOpenModal(true);
    setIsEditing(true);
    setAreaId(area.id);

    setValue("nome", area.nome);
    setValue("responsavel", area.responsavel);
    setValue("substitutoResponsavel", area.substitutoResponsavel);
    setValue("localizacoes", area.localizacoes);
  };

  useEffect(() => {
    loadAreas();
  }, []);

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
    <div className="component-accordion" id="gerenciar-area">
      <Accordion
        classes={{
          root: "bg-card-blue content-container",
        }}
      >
        <AccordionSummary
          expandIcon={<i className="bi bi-chevron-down" />}
          aria-controls="gerenciar-area"
          id="gerenciar-area-header"
          className="accordion-title"
        >
          Áreas
        </AccordionSummary>
        <AccordionDetails>
          <div className="accordion-header">
            <div className="filtro-container">
              <div className="filtro-input-div form-floating">
                <i className="bi bi-search" />
                <input
                  type="text"
                  className="form-control filtro-input"
                  id="nome-treinamento-filtro"
                  placeholder="Digite um termo para filtrar"
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div>
              <button onClick={handleToggleModal} type="button" className="button submit-button auto-width pd-2">
                <i className="bi bi-plus" />
                Adicionar Área
              </button>
            </div>
          </div>
          <div className="div-table">
            <table className="area-list-table">
              <thead>
                <tr key={"tr-head-area-list-table"}>
                  <th scope="col">Nome</th>
                  <th scope="col">Responsável</th>
                  <th scope="col">Substituto</th>
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
                        <div>{a.responsavel ?? "-"}</div>
                      </td>
                      <td>
                        <div>{a.substitutoResponsavel ?? "-"}</div>
                      </td>
                      <td>
                        <div className="table-action-buttons">
                          <button onClick={() => handleEditArea(a)} className="button action-button nbr">
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
                    <td className="no-data-on-table" colSpan={4}>
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
        <Box className="modal-content ov-y-scroll">
          <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
            <div className="div-input-formulario">
              <span>Nome da área</span>
              <input
                type="text"
                className={`input-formulario ${errors.nome ? "input-error" : ""}`}
                {...register("nome", { required: "Campo obrigatório" })}
                maxLength={255}
              />
              <div className="invalid-feedback d-block div-erro">{errors.nome?.message}</div>
            </div>

            <div className="div-input-formulario">
              <span>Localização</span>
              {locFields.map((field, index) => (
                <div className="loc-group" key={`div-loc-${index}`}>
                  <div className="localizacao-input-div">
                    <input
                      type="text"
                      className={`input-formulario localizacao-formulario ${errors.localizacoes ? "is-invalid" : ""}`}
                      id={`localizacao-${index}`}
                      placeholder="Localização"
                      {...register(`localizacoes.${index}.nome`, {
                        required: "Campo obrigatório",
                      })}
                      key={`loc-${index}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (locFields.length > 1) {
                          removeLoc(index);
                        }
                      }}
                      disabled={locFields.length <= 1}
                      className="remove-button"
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>
                </div>
              ))}

              <button type="button" onClick={() => appendLoc({ id: -1, nome: "" })} className="add-button">
                <i className="bi bi-plus-lg" />
              </button>
            </div>
            <div className="div-input-formulario">
              <span>Responsável</span>
              <Controller
                name="responsavel"
                control={control}
                rules={{ required: "Campo obrigatório" }}
                render={({ field }) => (
                  <select
                    id="responsavel"
                    className={`input-formulario ${errors.responsavel ? "input-error" : ""}`}
                    {...field}
                    value={usuariosResponsaveis.find((u) => u.nome === field.value)?.id || ""}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const selectedUser = usuariosResponsaveis.find((a) => a.id === selectedId);
                      field.onChange(selectedUser?.nome || "");
                    }}
                  >
                    <option value="">Selecione um responsável</option>
                    {usuariosResponsaveis.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                )}
              />
              <div className="invalid-feedback d-block div-erro">{errors.responsavel?.message}</div>
            </div>
            <div className="div-input-formulario">
              <span>Substituto</span>
              <Controller
                name="substitutoResponsavel"
                control={control}
                render={({ field }) => (
                  <select
                    id="substituto"
                    className={`input-formulario ${errors.substitutoResponsavel ? "input-error" : ""}`}
                    {...field}
                    value={usuariosResponsaveis.find((u) => u.nome === field.value)?.id || ""}
                    onChange={(e) => {
                      const selected = Number(e.target.value);
                      const selectedSubstituto = usuariosResponsaveis.find((a) => a.id === selected);

                      field.onChange(selectedSubstituto?.nome || "");
                    }}
                  >
                    <option value="">Selecione um substituto</option>
                    {usuariosResponsaveis.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                )}
              />
              <div className="invalid-feedback d-block div-erro">{errors.substitutoResponsavel?.message}</div>
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

export default GerenciarArea;
