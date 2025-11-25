import { FornecedorType } from "./fornecedor";

export type ContratoType = {
  id: number;
  objetoContrato: string;
  numeroContrato: string;
  descricao: string;
  termoParceria: string;
  inicioDataVigencia: string;
  fimDataVigencia: string;
  fornecedor: FornecedorType;
};
