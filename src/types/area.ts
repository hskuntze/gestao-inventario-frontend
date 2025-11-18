import { LocalizacaoType } from "./localizacao";

export type SetorType = {
  id: number;
  nome: string;
  responsavel: string;
  localizacoes: LocalizacaoType[];
};
