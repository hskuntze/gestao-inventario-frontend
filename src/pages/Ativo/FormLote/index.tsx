import "./styles.css";
import { ChangeEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";

import { SetorType } from "@/types/area";
import { ContratoType } from "@/types/contrato";
import { FornecedorType } from "@/types/fornecedor";
import { LocalizacaoType } from "@/types/localizacao";
import { UsuarioResponsavelType } from "@/types/usuario_responsavel";

import { requestBackend } from "@/utils/requests";
import { getUserData } from "@/utils/storage";
import { fetchAllContratos, fetchAllFornecedores } from "@/utils/functions";

import AtivoFormLoaderSkeleton from "../Form/AtivoFormLoaderSkeleton";

type TipoForm = "t" | "i" | "tl";

type AtivoUnitarioForm = {
  gerarIdPatrimonial: boolean;
  idPatrimonial: string;
  codigoSerie: string;
  codigoSerieNA: boolean;
  codigoSerieAtivoNuvem: boolean;
};

type FormData = {
  tipoAtivo: string | null;
  gerarIdPatrimonial: boolean;

  categoria: string;
  descricao: string; //descrição = nome (mudança de nomenclatura)
  area: SetorType; //área = setor (mudança de nomenclatura)
  localizacao: LocalizacaoType;
  usuarioResponsavel: UsuarioResponsavelType;
  contrato: ContratoType | null;
  fornecedor: FornecedorType;
  dataAquisicao: string; //data aquisição = data do recebimento (mudança de nomenclatura)
  numeroParte: string;
  observacoes: string;
  estadoConservacao: string;
  dataDevolucaoPrevista: string;
  dataDevolucaoRealizada: string;
  termoParceria: string;
  passivelEmprestimo: boolean;

  itens: AtivoUnitarioForm[];
};

const AtivoFormLote = () => {
  const user = getUserData();

  const [tipoForm, setTipoForm] = useState<TipoForm | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [contratos, setContratos] = useState<ContratoType[]>([]);
  const [allFornecedores, setAllFornecedores] = useState<FornecedorType[]>([]);

  const [checkPassivelEmprestimo, setCheckPassivelEmprestimo] = useState<boolean>(false);

  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  const navigate = useNavigate();

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
    resetField,
  } = useForm<FormData>({
    defaultValues: {
      itens: [
        {
          gerarIdPatrimonial: false,
          idPatrimonial: "",
          codigoSerie: "",
          codigoSerieNA: false,
          codigoSerieAtivoNuvem: false,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens",
  });

  const totalItens = fields.length;

  const onSubmit = (formData: FormData) => {
    setLoading(true);

    const urlsPost: { [key: string]: string } = {
      t: "/tangiveis/registrar/lote",
      i: "/intangiveis/registrar/lote",
      tl: "/tangiveis/locacao/registrar/lote",
    };

    if (tipoForm !== null) {
      let fornecedorId = formData.contrato && formData.contrato.fornecedor ? formData.contrato.fornecedor.id : null;

      const payload = formData.itens.map((item) => ({
        ...item,

        // 🔹 campos compartilhados
        descricao: formData.descricao,
        categoria: formData.categoria,
        area: { id: null },
        localizacao: { id: null },
        fornecedor: { id: fornecedorId },
        contrato: formData.contrato ? { id: formData.contrato.id } : null,
        dataAquisicao: formData.dataAquisicao,
        estadoConservacao: formData.estadoConservacao,
        passivelEmprestimo: formData.passivelEmprestimo,
        termoParceria: user.termoParceria,
      }));

      const requestParams: AxiosRequestConfig = {
        url: urlsPost[tipoForm],
        method: "POST",
        withCredentials: true,
        data: payload,
      };

      requestBackend(requestParams)
        .then((res) => {
          toast.success("Sucesso ao cadastrar lote de ativos.");
          navigate(`/gestao-inventario/ativo`);
        })
        .catch((err) => {
          toast.error("Erro ao tentar realizar o cadastro do lote de ativos.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleSelectTipoForm = (e: ChangeEvent<HTMLSelectElement>) => {
    let value = e.target.value;

    if (value !== "") {
      setValue("tipoAtivo", value);
      setTipoForm(e.target.value as TipoForm);
    } else {
      setValue("tipoAtivo", null);
      setTipoForm(null);
    }
  };

  useEffect(() => {
    async function getFornecedores() {
      setAllFornecedores([]);

      try {
        const data = (await fetchAllFornecedores()) as FornecedorType[];
        setAllFornecedores(data.filter((f) => !f.desabilitado));
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar fornecedores";
        toast.error(errorMsg);
      }
    }

    getFornecedores();
  }, []);

  useEffect(() => {
    async function getContratos() {
      setContratos([]);

      try {
        const data = await fetchAllContratos();
        setContratos(data.filter((c) => !c.desabilitado));
      } catch (err) {
        const errorMsg = (err as Error).message || "Erro desconhecido ao carregar contratos";
        toast.error(errorMsg);
      }
    }

    getContratos();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div className="header-content">
          <h2>
            Detalhes do Ativo <span className="tag-cadastro-em-lote">Cadastro em Lote</span>
          </h2>
          <div className="header-content-buttons">
            <Link to="/gestao-inventario/ativo" type="button" className="voltar-button">
              Voltar
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <AtivoFormLoaderSkeleton />
      ) : (
        <>
          <div className="select-tipo-ativo">
            <span>Tipo de ativo</span>
            <Controller
              name="tipoAtivo"
              control={control}
              render={({ field }) => (
                <select id="tipo-ativo" className={`input-formulario`} {...field} value={field.value ?? ""} onChange={handleSelectTipoForm}>
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
                <div className="content-container bg-card-container">
                  <span className="form-title">Informações do Ativo</span>
                  <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
                    <div className="div-input-formulario w-100">
                      <div>
                        <span>Nome</span>
                        <span className="obrigatorio-ast">*</span>
                      </div>
                      <input
                        id="descricao"
                        className={`input-formulario ${errors.descricao ? "input-error" : ""}`}
                        type="text"
                        {...register("descricao", { required: "Campo obrigatório" })}
                        maxLength={255}
                      />
                      <div className="invalid-feedback d-block div-erro">{errors.descricao?.message}</div>
                    </div>
                    <div className="div-input-formulario text-area-formulario">
                      <span>Descrição</span>
                      <textarea id="observacoes" className={`input-formulario`} rows={4} {...register("observacoes")} maxLength={255}></textarea>
                    </div>
                    <div className="div-input-formulario">
                      <div>
                        <span>Categoria</span>
                        <span className="obrigatorio-ast">*</span>
                      </div>
                      <Controller
                        name="categoria"
                        control={control}
                        rules={{
                          required: "Campo obrigatório",
                        }}
                        render={({ field }) => (
                          <select
                            id="categoria"
                            className={`input-formulario ${errors.categoria ? "input-error" : ""}`}
                            {...field}
                            value={field.value}
                          >
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
                      <div>
                        <span>Contrato</span>
                        <span className="obrigatorio-ast">*</span>
                      </div>
                      <Controller
                        name="contrato"
                        control={control}
                        rules={{
                          validate: (value) => {
                            if (value === null || value?.id === null) {
                              return true; // Aceita "sem contrato"
                            }
                            return true; // Tudo ok
                          },
                          required: "Campo obrigatório",
                        }}
                        render={({ field }) => (
                          <select
                            id="contrato"
                            className={`input-formulario ${errors.contrato ? "input-error" : ""}`}
                            {...field}
                            value={field.value === null ? "-1" : field.value?.id?.toString()}
                            onChange={(e) => {
                              const selectedValue = e.target.value;
                              if (selectedValue === "-1") {
                                // Se não tiver contrato...
                                setValue("dataDevolucaoPrevista", "");
                                resetField("dataDevolucaoPrevista");
                                // Libera o campo de fornecedor
                                resetField("dataDevolucaoPrevista");

                                // No form, o valor será null (sem contrato)
                                field.onChange({ id: null });
                              } else {
                                const selectedId = Number(selectedValue);
                                const sContrato = contratos.find((a) => a.id === selectedId) || null;

                                if (sContrato !== null) {
                                  setValue("dataDevolucaoPrevista", sContrato.fimDataVigencia);
                                  setValue("fornecedor", sContrato.fornecedor); // preenche fornecedor automaticamente
                                } else {
                                  resetField("dataDevolucaoPrevista");
                                  resetField("fornecedor");
                                }

                                field.onChange(sContrato);
                              }
                            }}
                          >
                            <option value="">Selecione um contrato</option>
                            {contratos &&
                              contratos.length > 0 &&
                              contratos.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.numeroContrato}
                                </option>
                              ))}
                          </select>
                        )}
                      />
                      <div className="invalid-feedback d-block div-erro">{errors.contrato?.message}</div>
                    </div>
                    <div className="div-input-formulario">
                      <div>
                        <span>Fornecedor</span>
                      </div>
                      <Controller
                        name="fornecedor"
                        control={control}
                        render={({ field }) => (
                          <select
                            id="fornecedor"
                            className={`input-formulario ${errors.fornecedor ? "input-error" : ""} disabled-field`}
                            {...field}
                            value={field.value?.id || ""}
                            onChange={(e) => {
                              const selectedId = Number(e.target.value);
                              const fornecedorSelecionado = allFornecedores.find((f) => f.id === selectedId) || null;

                              if (fornecedorSelecionado !== null) {
                                field.onChange(fornecedorSelecionado);
                              }
                            }}
                            disabled={true}
                          >
                            <option value="">Selecione um fornecedor</option>
                            {allFornecedores &&
                              allFornecedores.length > 0 &&
                              allFornecedores.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.nome}
                                </option>
                              ))}
                          </select>
                        )}
                      />
                      <div className="invalid-feedback d-block div-erro">{errors.fornecedor?.message}</div>
                    </div>
                    {tipoForm === "tl" && (
                      <>
                        <div className="div-input-formulario">
                          <div>
                            <span>Data de devolução prevista</span>
                          </div>
                          <input
                            type="date"
                            className={`input-formulario data-input ${errors.dataDevolucaoPrevista ? "input-error" : ""} disabled-field`}
                            {...register("dataDevolucaoPrevista")}
                            disabled={true}
                          />
                          <div className="invalid-feedback d-block div-erro">{errors.dataDevolucaoPrevista?.message}</div>
                        </div>
                      </>
                    )}
                    <div className="div-input-formulario">
                      <div>
                        <span>Data do recebimento</span>
                        <span className="obrigatorio-ast">*</span>
                      </div>
                      <input
                        type="date"
                        defaultValue={new Date().toISOString().split("T")[0]}
                        className={`input-formulario data-input ${errors.dataAquisicao ? "input-error" : ""}`}
                        {...register("dataAquisicao", { required: "Campo obrigatório" })}
                      />
                      <div className="invalid-feedback d-block div-erro">{errors.dataAquisicao?.message}</div>
                    </div>
                    {tipoForm !== "i" && (
                      <div className="div-input-formulario">
                        <div>
                          <span>Estado de conservação</span>
                          <span className="obrigatorio-ast">*</span>
                        </div>
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
                    {tipoForm !== "i" && (
                      <div className="div-input-formulario">
                        <div>
                          <span>PartNumber (PN)</span>
                        </div>
                        <input
                          type="text"
                          className={`input-formulario ${errors.numeroParte ? "input-error" : ""}`}
                          {...register("numeroParte")}
                          maxLength={255}
                        />
                        <div className="invalid-feedback d-block div-erro">{errors.numeroParte?.message}</div>
                      </div>
                    )}
                    <div className="row-input-fields">
                      <div className="div-input-formulario div-input-checkbox">
                        <span>Passível de Empréstimo</span>
                        <Controller
                          name="passivelEmprestimo"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              id="passivelEmprestimo"
                              className={`checkbox-input-formulario ${errors.passivelEmprestimo ? "input-error" : ""}`}
                              checked={checkPassivelEmprestimo}
                              onChange={(e) => {
                                field.onChange(e.target.checked);
                                setCheckPassivelEmprestimo(!checkPassivelEmprestimo);
                              }}
                            />
                          )}
                        />
                        <span>Este ativo pode ser emprestado?</span>
                      </div>
                    </div>
                    <div className="lote-container w-100">
                      <h4>Ativos do Lote</h4>
                      <span className="contador-objeto-ativo">Total de ativos: {totalItens}</span>
                      {fields.map((field, index) => {
                        const gerarId = watch(`itens.${index}.gerarIdPatrimonial`);
                        const codigoNA = watch(`itens.${index}.codigoSerieNA`);
                        const codigoNuvem = watch(`itens.${index}.codigoSerieAtivoNuvem`);

                        return (
                          <div className={`objeto-ativo ${removingIndex === index ? "removing" : ""}`}>
                            <div key={field.id} className="row-input-fields">
                              <div className="div-input-formulario">
                                <div>
                                  <span>ID Patrimonial</span>
                                  <span className="obrigatorio-ast">*</span>
                                </div>
                                <input
                                  type="text"
                                  {...register(`itens.${index}.idPatrimonial`, {
                                    required: !gerarId && "Campo obrigatório",
                                  })}
                                  disabled={gerarId}
                                  className={`input-formulario ${errors.itens?.[index]?.idPatrimonial ? "input-error" : ""} ${
                                    gerarId ? "disabled-field" : ""
                                  }`}
                                />
                              </div>
                              <div className="div-input-formulario div-input-checkbox">
                                <span>Gerar ID Patrimonial</span>
                                <input
                                  type="checkbox"
                                  {...register(`itens.${index}.gerarIdPatrimonial`)}
                                  className={`checkbox-input-formulario ${errors.gerarIdPatrimonial ? "input-error" : ""}`}
                                />
                              </div>
                            </div>
                            <div className="row-input-fields w-100">
                              <div className="div-input-formulario">
                                <div>
                                  <span>Número de série</span>
                                  <span className="obrigatorio-ast">*</span>
                                </div>
                                <input
                                  className={`input-formulario ${errors.itens?.[index]?.codigoSerie ? "input-error" : ""} ${
                                    codigoNA || codigoNuvem ? "disabled-field" : ""
                                  }`}
                                  {...register(`itens.${index}.codigoSerie`, {
                                    required: !codigoNA && !codigoNuvem && "Campo obrigatório",
                                  })}
                                  disabled={codigoNA || codigoNuvem}
                                />
                              </div>
                              <div className="div-input-formulario div-input-checkbox">
                                <span>N/A</span>
                                <input
                                  id="check-na"
                                  type="checkbox"
                                  className={`checkbox-input-formulario`}
                                  {...register(`itens.${index}.codigoSerieNA`)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setValue(`itens.${index}.codigoSerieNA`, checked);
                                    setValue(`itens.${index}.codigoSerieAtivoNuvem`, false);

                                    if (checked) {
                                      setValue(`itens.${index}.codigoSerie`, "N/A");
                                    } else {
                                      resetField(`itens.${index}.codigoSerie`);
                                    }
                                  }}
                                />
                              </div>
                              {tipoForm === "i" && (
                                <div className="div-input-formulario div-input-checkbox">
                                  <span>Ativação realizada na Nuvem</span>
                                  <input
                                    id="check-ativo-nuvem"
                                    className={`checkbox-input-formulario`}
                                    type="checkbox"
                                    {...register(`itens.${index}.codigoSerieAtivoNuvem`)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setValue(`itens.${index}.codigoSerieAtivoNuvem`, checked);
                                      setValue(`itens.${index}.codigoSerieNA`, false);

                                      if (checked) {
                                        setValue(`itens.${index}.codigoSerie`, "Ativação realizada na Nuvem");
                                      } else {
                                        resetField(`itens.${index}.codigoSerie`);
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            <button
                              className={`button voltar-button auto-width pd-2 mt-3  ${totalItens === 1 ? "disabled-field" : ""}`}
                              type="button"
                              onClick={() => {
                                setRemovingIndex(index);

                                setTimeout(() => {
                                  remove(index);
                                  setRemovingIndex(null);
                                }, 500); // mesmo tempo do CSS
                              }}
                              disabled={totalItens === 1}
                              title={fields.length === 1 ? "O lote deve conter ao menos um ativo" : ""}
                            >
                              Remover
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className={`button aprovar-button auto-width pd-2 mt-2`}
                        onClick={() =>
                          append({
                            gerarIdPatrimonial: false,
                            idPatrimonial: "",
                            codigoSerie: "",
                            codigoSerieNA: false,
                            codigoSerieAtivoNuvem: false,
                          })
                        }
                      >
                        Adicionar ativo
                      </button>
                    </div>
                    <div className="form-bottom">
                      <div className="legenda">* Campos obrigatórios</div>
                      <div className="form-buttons">
                        <button className={`button submit-button`}>Salvar</button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AtivoFormLote;
