import { Arquivo } from "./arquivo";
import { AtivoType } from "./ativo";
import { UsuarioResponsavelType } from "./usuario_responsavel";

export type SolicitacaoType = {
  id: number;
  ativo: AtivoType;
  usuarioResponsavel: UsuarioResponsavelType;
  dataSolicitacao: string;
  motivoSolicitacao: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  motivoReprovado: string;
  termoCautela: Arquivo | null;
};
