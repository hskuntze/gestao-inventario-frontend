import { Perfil } from "./perfil";
import { UsuarioResponsavelType } from "./usuario_responsavel";

export type User = {
  id: number;
  nome: string;
  email: string;
  login: string;
  userUuid: string;
  firstAccess: boolean;
  userState: number;
  userEnabled: boolean;
  expired: boolean;
  locked: boolean;
  termoParceria: string;
  perfis: Perfil[];
  usuarioResponsavel: UsuarioResponsavelType;
};
