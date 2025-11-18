import { SetorType } from "./area";

export type UsuarioResponsavelType = {
  id: number;
  nome: string;
  email: string;
  area: SetorType; //área = setor (mudança de nomenclatura)
};
