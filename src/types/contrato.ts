import { FornecedorType } from "./fornecedor";

export type ContratoType = {
  id: number;
  titulo: string;
  descricao: string;
  termoParceria: string;
  inicioDataVigencia: string;
  fimDataVigencia: string;
  fornecedores: FornecedorType[];
};
