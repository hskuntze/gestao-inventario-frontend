import "./styles.css";
import { Controller, useForm } from "react-hook-form";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { AxiosRequestConfig } from "axios";
import { requestBackend } from "@/utils/requests";
import { toast } from "react-toastify";
import UploadArquivos from "@/components/UploadArquivos";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AtivoType } from "@/types/ativo";
import { HistoricoType } from "@/types/historico";
import CardHistoricoAtivo from "@/components/CardHistoricoAtivo";

type FormData = {
  tipoAtivo: string | null;

  idPatrimonial: string;
  categoria: string;
  descricao: string;
  area: string;
  localizacao: string;
  responsavel: string;
  usuarioResponsavel: string;
  fornecedor: string;
  dataAquisicao: string;
  codigoSerie: string;
  observacoes: string;
  linkDocumento: string;
  estadoConservacao: string;
};

type UrlParams = {
  id: string;
};

const AtivoForm = () => {
  const urlParams = useParams<UrlParams>();
  const isEditing = urlParams.id === "create" ? false : true;

  const [tipoForm, setTipoForm] = useState<"t" | "i" | "tl" | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [ativo, setAtivo] = useState<AtivoType>();
  const [historicoAtivo, setHistoricoAtivo] = useState<HistoricoType[]>();

  const navigate = useNavigate();

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<FormData>();

  const handleSelectTipoForm = (e: ChangeEvent<HTMLSelectElement>) => {
    let value = e.target.value;

    if (value !== "") {
      setValue("tipoAtivo", value);
      setTipoForm(e.target.value as "t" | "i" | "tl");
    } else {
      setValue("tipoAtivo", null);
      setTipoForm(null);
    }
  };

  const onSubmit = (formData: FormData) => {
    setLoading(true);

    const urlsPost: { [key: string]: string } = {
      t: "/tangiveis/registrar",
      i: "/intangiveis/registrar",
      tl: "/tangiveis/locacao/registrar",
    };

    const urlsPut: { [key: string]: string } = {
      t: `/tangiveis/atualizar/${urlParams.id}`,
      i: `/intangiveis/atualizar/${urlParams.id}`,
      tl: `/tangiveis/locacao/atualizar/${urlParams.id}`,
    };

    if (tipoForm !== null) {
      const requestParams: AxiosRequestConfig = {
        url: isEditing ? urlsPut[tipoForm] : urlsPost[tipoForm],
        method: isEditing ? "PUT" : "POST",
        withCredentials: true,
        data: {
          ...formData,
        },
      };

      requestBackend(requestParams)
        .then((res) => {
          toast.success(isEditing ? "Sucesso ao atualizar o cadastro do ativo" : "Sucesso ao cadastrar novo ativo");
          navigate("/gestao-inventario/ativo");
        })
        .catch((err) => {
          toast.error(isEditing ? "Erro ao tentar atualizar o cadastro do ativo" : "Erro ao tentar realizar o cadastro do ativo");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const loadInfo = useCallback(() => {
    const requestParams: AxiosRequestConfig = {
      url: `/ativos/${urlParams.id}`,
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        let data = res.data as AtivoType;

        setAtivo(data);

        setValue("tipoAtivo", data.tipoAtivo);
        setTipoForm(data.tipoAtivo as "t" | "i" | "tl");

        setValue("area", data.area);
        setValue("categoria", data.categoria);
        setValue("codigoSerie", data.codigoSerie);
        setValue("dataAquisicao", data.dataAquisicao);
        setValue("descricao", data.descricao);
        setValue("estadoConservacao", data.estadoConservacao);
        setValue("fornecedor", data.fornecedor);
        setValue("idPatrimonial", data.idPatrimonial);
        setValue("linkDocumento", data.linkDocumento);
        setValue("localizacao", data.localizacao);
        setValue("observacoes", data.observacoes);
        setValue("responsavel", data.responsavel);
        setValue("usuarioResponsavel", data.usuarioResponsavel);
      })
      .catch((err) => {
        toast.error("Erro ao tentar carregar dados do ativo");
      });
  }, [urlParams.id, setValue]);

  const loadHistoricoInfo = useCallback(() => {
    const requestParams: AxiosRequestConfig = {
      url: `/historico/ativo/${urlParams.id}`,
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        setHistoricoAtivo(res.data as HistoricoType[]);
      })
      .catch((err) => {
        toast.error("Erro ao tentar carregar dados do histórico");
      })
      .finally(() => {});
  }, [urlParams.id]);

  const printQrCode = (image: string) => {
    window.print();
  };

  useEffect(() => {
    if (isEditing) {
      loadInfo();
      loadHistoricoInfo();
    }
  }, [isEditing, loadInfo, loadHistoricoInfo]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="header-content">
          <h2>Detalhes do Ativo</h2>
          <Link to="/gestao-inventario/ativo" type="button" className="voltar-button">
            Voltar
          </Link>
        </div>
      </div>
      <div className="select-tipo-ativo">
        <span>Tipo de ativo</span>
        <Controller
          name="tipoAtivo"
          control={control}
          render={({ field }) => (
            <select
              id="tipo-ativo"
              disabled={isEditing ? true : false}
              className={`input-formulario`}
              {...field}
              value={field.value ?? ""}
              onChange={handleSelectTipoForm}
            >
              <option value="">Selecione um tipo de ativo</option>
              <option value="t">Tangível</option>
              <option value="i">Intangível</option>
              <option value="tl">Tangível de Locação</option>
            </select>
          )}
        />
      </div>
      {tipoForm !== null && (
        <div className="page-content">
          <div className="page-body">
            <>
              <div className="content-container">
                <span className="form-title">Informações do Ativo</span>
                <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
                  <div className="div-input-formulario text-area-formulario">
                    <span>Descrição</span>
                    <textarea
                      id="descricao"
                      className={`input-formulario ${errors.descricao ? "input-error" : ""}`}
                      rows={4}
                      {...register("descricao", { required: "Campo obrigatório" })}
                    ></textarea>
                    <div className="invalid-feedback d-block div-erro">{errors.descricao?.message}</div>
                  </div>
                  <div className="div-input-formulario">
                    <span>ID Patrimonial</span>
                    <input type="text" className="input-formulario" {...register("idPatrimonial")} />
                  </div>
                  <div className="div-input-formulario">
                    <span>Categoria</span>
                    <Controller
                      name="categoria"
                      control={control}
                      rules={{
                        required: "Campo obrigatório",
                      }}
                      render={({ field }) => (
                        <select id="categoria" className={`input-formulario ${errors.categoria ? "input-error" : ""}`} {...field} value={field.value}>
                          <option value="">Selecione uma categoria</option>
                          <option value="ELETRONICO">Eletrônico</option>
                          <option value="ACESSORIO">Acessório</option>
                          <option value="INFORMATICA">Informática</option>
                          <option value="MOBILIARIO">Mobiliário</option>
                          <option value="CERTIFICADO">Certificado</option>
                          <option value="SOFTWARE">Software</option>
                          <option value="EPI">EPI</option>
                        </select>
                      )}
                    />
                    <div className="invalid-feedback d-block div-erro">{errors.categoria?.message}</div>
                  </div>
                  <div className="div-input-formulario">
                    <span>Área</span>
                    <Controller
                      name="area"
                      control={control}
                      rules={{
                        required: "Campo obrigatório",
                      }}
                      render={({ field }) => (
                        <select id="area" className={`input-formulario ${errors.area ? "input-error" : ""}`} {...field} value={field.value}>
                          <option value="">Selecione uma área</option>
                          <option value="GAP">GAP</option>
                          <option value="GPS">GPS</option>
                          <option value="GTI">GTI</option>
                        </select>
                      )}
                    />
                    <div className="invalid-feedback d-block div-erro">{errors.area?.message}</div>
                  </div>
                  <div className="div-input-formulario">
                    <span>Localização</span>
                    <input type="text" className="input-formulario" {...register("localizacao")} />
                  </div>
                  <div className="div-input-formulario">
                    <span>Responsável</span>
                    <input
                      type="text"
                      className={`input-formulario ${errors.responsavel ? "input-error" : ""}`}
                      {...register("responsavel", { required: "Campo obrigatório" })}
                    />
                    <div className="invalid-feedback d-block div-erro">{errors.responsavel?.message}</div>
                  </div>
                  <div className="div-input-formulario">
                    <span>Usuário responsável</span>
                    <input
                      type="text"
                      className={`input-formulario ${errors.usuarioResponsavel ? "input-error" : ""}`}
                      {...register("usuarioResponsavel", { required: "Campo obrigatório" })}
                    />
                    <div className="invalid-feedback d-block div-erro">{errors.usuarioResponsavel?.message}</div>
                  </div>
                  <div className="div-input-formulario">
                    <span>Fornecedor</span>
                    <input
                      type="text"
                      className={`input-formulario ${errors.fornecedor ? "input-error" : ""}`}
                      {...register("fornecedor", { required: "Campo obrigatório" })}
                    />
                    <div className="invalid-feedback d-block div-erro">{errors.fornecedor?.message}</div>
                  </div>
                  <div className="div-input-formulario">
                    <span>Data aquisição</span>
                    <input
                      type="date"
                      className={`input-formulario data-input ${errors.dataAquisicao ? "input-error" : ""}`}
                      {...register("dataAquisicao", { required: "Campo obrigatório" })}
                    />
                    <div className="invalid-feedback d-block div-erro">{errors.dataAquisicao?.message}</div>
                  </div>
                  {tipoForm !== "i" && (
                    <div className="div-input-formulario">
                      <span>Estado de conservação</span>
                      <Controller
                        name="estadoConservacao"
                        control={control}
                        rules={{
                          required: "Campo obrigatório",
                        }}
                        render={({ field }) => (
                          <select
                            id="estadoConservacao"
                            className={`input-formulario ${errors.estadoConservacao ? "input-error" : ""}`}
                            {...field}
                            value={field.value}
                          >
                            <option value="">Selecione um estado de conservação</option>
                            <option value="Novo">Novo</option>
                            <option value="Ótimo">Ótimo</option>
                            <option value="Bom">Bom</option>
                            <option value="Ruim">Ruim</option>
                          </select>
                        )}
                      />
                      <div className="invalid-feedback d-block div-erro">{errors.estadoConservacao?.message}</div>
                    </div>
                  )}
                  <div className="div-input-formulario">
                    <span>Código de série</span>
                    <input
                      type="text"
                      className={`input-formulario ${errors.codigoSerie ? "input-error" : ""}`}
                      {...register("codigoSerie", { required: "Campo obrigatório" })}
                    />
                    <div className="invalid-feedback d-block div-erro">{errors.codigoSerie?.message}</div>
                  </div>
                  <div className={`div-input-formulario ${tipoForm !== "i" ? "input-full-width" : ""}`}>
                    <span>Link do documento</span>
                    <input type="text" className="input-formulario" {...register("linkDocumento")} />
                  </div>
                  <div className="div-input-formulario text-area-formulario">
                    <span>Observações</span>
                    <textarea id="observacoes" className="input-formulario" rows={4} {...register("observacoes")}></textarea>
                  </div>
                  <div className="form-buttons">
                    <button className="button submit-button">Salvar</button>
                  </div>
                </form>
              </div>
              <div className="content-container">
                <span className="form-title">Anexos</span>
                {ativo ? (
                  <UploadArquivos tipoAtivo={tipoForm} idAtivo={String(ativo.id)} defaultFiles={ativo?.imagens} />
                ) : (
                  <UploadArquivos tipoAtivo={tipoForm} />
                )}
              </div>
            </>
          </div>
          <div className="page-side-section">
            <div className="content-container">
              <span className="form-title">Histórico do Ativo</span>
              <div className="historico-body">
                {ativo && historicoAtivo ? (
                  historicoAtivo.map((h) => <CardHistoricoAtivo key={h.id} ativo={ativo} element={h} />)
                ) : (
                  <div className="no-info">Sem histórico a ser exibido</div>
                )}
              </div>
            </div>
            {ativo && (
              <div className="content-container qr-container">
                <button onClick={() => printQrCode(ativo.qrCodeImage)} type="button" className="print-button">
                  <i className="bi bi-printer print-qr-code-icon" />
                </button>
                <img className="qr-image" src={`data:image/png;base64,${ativo.qrCodeImage}`} alt="QRCode" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AtivoForm;
