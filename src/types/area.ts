import { LocalizacaoType } from "./localizacao";

export type AreaType = {
  id: number;
  nome: string;
  responsavel: string;
  substitutoResponsavel: string;
  localizacoes: LocalizacaoType[];
};
