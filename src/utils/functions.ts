import { AxiosRequestConfig } from "axios";
import { requestBackend } from "./requests";
import { SetorType } from "@/types/area";
import { FornecedorType } from "@/types/fornecedor";
import { UsuarioResponsavelType } from "@/types/usuario_responsavel";
import { LocalizacaoType } from "@/types/localizacao";
import { NotificacaoType } from "@/types/notificacao";
import { ContratoType } from "@/types/contrato";
import { AtivoType } from "@/types/ativo";

/**
 * Função que recebe uma data (em string) no formato 'yyyy-mm-dd' e formata para 'dd/mm/yyyy'
 * @param date - String
 * @returns String formatada
 */
export const formatarData = (date: string) => {
  if (date && date !== "-" && date !== "00:00:00") {
    let containsT = date.includes("T");
    let containsSpace = date.includes(" ");
    if (containsSpace) {
      const [dt, time] = date.split(" ");
      const [year, month, day] = dt.split("-");
      return `${day}/${month}/${year}`;
    } else if (!containsT) {
      const [year, month, day] = date.split("-"); // Divide a string em ano, mês e dia
      return `${day}/${month}/${year}`;
    } else {
      let aux = date.split("T");
      const [year, month, day] = aux[0].split("-");
      return `${day}/${month}/${year}`;
    }
  } else {
    return "-";
  }
};

export const tiposAtivo: { [key: string]: string } = {
  t: "TANGÍVEL",
  i: "INTANGÍVEL",
  tl: "LOCAÇÃO",
};

export function formatarDataParaMesAno(dataStr: string): string {
  if (dataStr !== "" && dataStr !== "-") {
    const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

    const data = new Date(dataStr);
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();

    return `${mes}/${ano}`;
  } else {
    return "-";
  }
}

export function formatarDataParaDiaMesAno(dataStr: string): string {
  if (dataStr !== "" && dataStr !== "-") {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    const data = new Date(dataStr);
    const dia = data.getDay();
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();

    return `${dia} ${mes}, ${ano}`;
  } else {
    return "-";
  }
}

export function formatarPerfil(perfil: string): string {
  const perfis: { [key: string]: string } = {
    PERFIL_ADMIN: "Administrador do Sistema",
    PERFIL_ADMIN_TP: "Analista de Inventário",
    PERFIL_GERENTE: "Gerente",
    PERFIL_USUARIO: "Usuário de Sistema",
  };

  return perfis[perfil] ?? "Sem perfil definido";
}

export async function fetchAllSetores(): Promise<SetorType[]> {
  const requestParams: AxiosRequestConfig = {
    url: "/areas/all",
    method: "GET",
    withCredentials: true,
  };

  try {
    const res = await requestBackend(requestParams);
    return res.data as SetorType[];
  } catch (err) {
    throw new Error("Falha ao buscar os setores.");
  }
}

export async function fetchAllLocalizacoesByAreaId(id: number): Promise<LocalizacaoType[]> {
  const requestParams: AxiosRequestConfig = {
    url: `/localizacoes/all/${id}`,
    method: "GET",
    withCredentials: true,
  };

  try {
    const res = await requestBackend(requestParams);
    return res.data as LocalizacaoType[];
  } catch (err) {
    throw new Error("Falha ao buscar as localizações.");
  }
}

export async function fetchAllFornecedores(): Promise<FornecedorType[]> {
  const requestParams: AxiosRequestConfig = {
    url: "/fornecedores/all",
    method: "GET",
    withCredentials: true,
  };

  try {
    const res = await requestBackend(requestParams);
    return res.data as FornecedorType[];
  } catch (err) {
    throw new Error("Falha ao buscar os fornecedores.");
  }
}

export async function fetchAllUsuariosResponsaveis(): Promise<UsuarioResponsavelType[]> {
  const requestParams: AxiosRequestConfig = {
    url: "/usuarios/responsaveis/all",
    method: "GET",
    withCredentials: true,
  };

  try {
    const res = await requestBackend(requestParams);
    return res.data as UsuarioResponsavelType[];
  } catch (err) {
    throw new Error("Falha ao buscar os usuários.");
  }
}

export async function fetchAllUsuariosResponsaveisByAreaId(id: number): Promise<UsuarioResponsavelType[]> {
  const requestParams: AxiosRequestConfig = {
    url: `/usuarios/responsaveis/area/${id}`,
    method: "GET",
    withCredentials: true,
  };

  try {
    const res = await requestBackend(requestParams);
    return res.data as UsuarioResponsavelType[];
  } catch (err) {
    throw new Error("Falha ao buscar os usuários.");
  }
}

export async function fetchAllNotificacoes(): Promise<NotificacaoType[]> {
  const requestParams: AxiosRequestConfig = {
    url: "/notificacoes/all",
    method: "GET",
    withCredentials: true,
  };

  try {
    const res = await requestBackend(requestParams);
    return res.data as NotificacaoType[];
  } catch (err) {
    throw new Error("Falha ao buscar notificações.");
  }
}

export async function fetchAllAtivosRecentes(): Promise<AtivoType[]> {
  const requestParams: AxiosRequestConfig = {
    url: "/historico/recentes",
    method: "GET",
    withCredentials: true,
  };

  try {
    const res = await requestBackend(requestParams);
    return res.data as AtivoType[];
  } catch (err) {
    throw new Error("Falha ao buscar os ativos recentes.");
  }
}

export async function fetchAllContratos(): Promise<ContratoType[]> {
  const requestParams: AxiosRequestConfig = {
    url: "/contratos/all",
    method: "GET",
    withCredentials: true,
  };

  try {
    const res = await requestBackend(requestParams);
    return res.data as ContratoType[];
  } catch (err) {
    throw new Error("Falha ao buscar contratos.");
  }
}

export function base64ToBlob(base64: string, nome: string): Blob {
  try {
    // Remove quebras de linha e espaços que possam ter vindo do banco
    const cleanedBase64 = base64.replace(/[\r\n\s]/g, "");

    const byteCharacters = atob(cleanedBase64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    let mimeType = "";

    if(nome.includes(".pdf")) {
      mimeType = "application/pdf";
    } else {
      mimeType = "image/jpg";
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (error) {
    console.error("Erro ao converter base64 para Blob:", error);
    throw error;
  }
}
