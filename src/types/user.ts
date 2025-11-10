import { Perfil } from "./perfil";

export type User = {
  id: number;
  nome: string;
  email: string;
  login: string;
  userUuid: string;
  firstAccess: number;
  userState: number;
  termoParceria: string;
  perfis: Perfil[];
};
