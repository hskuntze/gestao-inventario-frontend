import { Imagem } from "./imagem";

export type AtivoType = {
  id: number;
  idPatrimonial: string;
  categoria: string;
  descricao: string;
  area: string;
  localizacao: string;
  responsavel: string;
  usuarioResponsavel: string;
  fornecedor: string;
  dataAquisicao: string;
  codigoSerie: string;
  observacoes: string;
  linkDocumento: string;
  estadoConservacao: string;
  qrCodeUrl: string;
  qrCodeImage: string;
  tipoAtivo: string;
  imagens: Imagem[];
};
