import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";

let isSet = false;

export function setupInterceptors(navigate: (path: string) => void) {
  if (isSet) return; // evita configurar mais de uma vez
  isSet = true;

  axios.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status;
      const errorData = error.response?.data as { error: string, message: string };

      switch (status) {
        case 401:
          toast.error(errorData.message ? errorData.message : "Sessão expirada. Faça login novamente.");
          navigate("/gestao-inventario/login");
          break;

        case 403:
          toast.warning(errorData.message ? errorData.message : "Você não possui permissão para acessar este recurso.");
          navigate("/gestao-inventario/nao-autorizado");
          break;

        case 404:
          navigate("/gestao-inventario/nao-encontrado");
          break;

        case 500:
          toast.error(errorData.message ? errorData.message : "Erro interno do servidor. Tente novamente mais tarde.");
          break;

        default:
          toast.error(errorData.message ? errorData.message : "Ocorreu um erro inesperado.");
      }

      return Promise.reject(error);
    }
  );
}
