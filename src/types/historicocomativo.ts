import { AtivoType } from "./ativo";

export type HistoricoComAtivoType = {
  id: number;
  createdAt: string;
  operacao: string;
  ativo: AtivoType;
  userId: number;
  userLogin: string;
  userNome: string;
  area: string; //área = setor (mudança de nomenclatura)
  localizacao: string;
  usuarioResponsavel: string;
};
