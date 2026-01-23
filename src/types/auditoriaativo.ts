export type AuditoriaAtivoType = {
  id: number;
  ativoId: number;
  idPatrimonioAtivo: string;
  categoriaAtivo: string;
  nomeAtivo: string;
  setorAtivo: string;
  localizacaoAtivo: string;
  usuarioResponsavelAtivo: string;
  tipoAtivo: string;
  status: string;
  dataConferencia: string | null;
  observacao: string | null;
  idUsuarioConferidor: number | null;
  nomeUsuarioConferidor: number | null;
};
