import { AuditoriaAtivoType } from "./auditoriaativo";
import { Quadrimestre } from "./quadrimestre";

export type AuditoriaType = {
  id: number;
  ano: number;
  quadrimestre: Quadrimestre;
  dataGeracao: string;
  encerrada: boolean;
  dataEncerramento: string | null;
  idUsuarioEncerrador: number | null;
  nomeUsuarioEncerrador: string | null;
  ativos: AuditoriaAtivoType[];
};
