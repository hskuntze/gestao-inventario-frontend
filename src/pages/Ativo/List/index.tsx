import { useCallback, useEffect, useState } from "react";
import "./styles.css";
import { AtivoType } from "@/types/ativo";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const AtivoList = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [ativos, setAtivos] = useState<AtivoType[]>([]);
  const [reload, setReload] = useState<boolean>(false);

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

  const deleteAtivo = (id: number, tipo: string) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir este item?");

    if(!confirmed) {
      return;
    }

    const urls: { [key: string]: string } = {
      t: `/tangiveis/excluir/${id}`,
      i: `/intangiveis/excluir/${id}`,
      tl: `/tangiveis/locacao/excluir/${id}`,
    };

    const requestParams: AxiosRequestConfig = {
      url: urls[tipo],
      method: "DELETE",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success("Registro excluído.");
        setReload((prev) => !prev);
      })
      .catch((err) => {
        toast.error("Erro ao excluir registro.");
      });
  };

  useEffect(() => {
    loadAtivos();
  }, [loadAtivos, reload]);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Inventário de Ativos</h2>
        <span className="page-subtitle">Visualize e gerencie todos os ativos.</span>
      </div>
      <div className="page-body w-100">
        <div className="content-container">
          <table className="ativo-list-table">
            <thead>
              <tr>
                <th scope="col">Descrição</th>
                <th scope="col">ID</th>
                <th scope="col">Categoria</th>
                <th scope="col">Localização</th>
                <th scope="col">Usuário Designado</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ativos && ativos.length > 0 ? (
                ativos.map((a) => (
                  <>
                    <tr>
                      <td>
                        <div>{a.descricao}</div>
                      </td>
                      <td>
                        <div>{a.idPatrimonial ?? "N/A"}</div>
                      </td>
                      <td>
                        <div>{a.categoria}</div>
                      </td>
                      <td>
                        <div>{a.localizacao}</div>
                      </td>
                      <td>
                        <div>{a.usuarioResponsavel ?? "Sem usuário"}</div>
                      </td>
                      <td>
                        <div className="table-action-buttons">
                          <Link to={`/gestao-inventario/ativo/formulario/${a.id}`} className="button action-button">
                            <i className="bi bi-pencil" />
                          </Link>
                          <button onClick={() => deleteAtivo(a.id, a.tipoAtivo)} type="button" className="button action-button delete-button">
                            <i className="bi bi-trash3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </>
                ))
              ) : (
                <tr>
                  <td className="no-data-on-table" colSpan={6}>Sem dados a serem exibidos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AtivoList;
