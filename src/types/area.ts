import { LocalizacaoType } from "./localizacao";

export type SetorType = {
  id: number;
  nome: string;
  sigla: string;
  responsavel: string;
  localizacoes: LocalizacaoType[];
};
