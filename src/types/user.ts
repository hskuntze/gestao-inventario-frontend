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
  termoParceria: string;
  perfis: Perfil[];
  usuarioResponsavel: UsuarioResponsavelType;
};
