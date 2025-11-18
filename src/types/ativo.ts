import { SetorType } from "./area";
import { ContratoType } from "./contrato";
import { FornecedorType } from "./fornecedor";
import { Imagem } from "./imagem";
import { LocalizacaoType } from "./localizacao";
import { UsuarioResponsavelType } from "./usuario_responsavel";

export type AtivoType = {
  id: number;
  idPatrimonial: string;
  gerarIdPatrimonial: boolean;
  categoria: string;
  descricao: string;
  area: SetorType; //área = setor (mudança de nomenclatura)
  localizacao: LocalizacaoType;
  usuarioResponsavel: UsuarioResponsavelType;
  fornecedor: FornecedorType;
  contrato: ContratoType;
  dataAquisicao: string;
  codigoSerie: string;
  observacoes: string;
  linkDocumento: string;
  estadoConservacao: string;
  qrCodeUrl: string;
  qrCodeImage: string;
  tipoAtivo: string;
  desabilitado: boolean;
  razaoDesabilitado: string;
  imagens: Imagem[];
  dataDevolucaoPrevista?: string;
  dataDevolucaoRealizada?: string;
  termoParceria: string;
};
