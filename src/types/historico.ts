export type HistoricoType = {
  id: number;
  createdAt: string;
  operacao: string;
  ativo: number;
  userId: number;
  userLogin: string;
  area: string; //área = setor (mudança de nomenclatura)
  localizacao: string;
  usuarioResponsavel: string;
};
