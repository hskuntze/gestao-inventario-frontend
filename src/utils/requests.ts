import config from "../config";
import QueryString from "qs";
import axios, { AxiosRequestConfig } from "axios";
import { getAuthData } from "./storage";

/**
 * LOCALHOST TESTE
 */
// export const BASE_URL =
//   process.env.REACT_APP_BACKEND_URL ?? "http://172.20.71.101:9005/gestaoinventario/api";

/**
 * LOCALHOST DEV
 */
export const BASE_URL =
  process.env.REACT_APP_BACKEND_URL ?? "http://172.20.71.101:9006/gestaoinventario/api";

/**
 * HOMOL
 */
// export const BASE_URL =
//   process.env.REACT_APP_BACKEND_URL ?? "http://10.134.0.165:9006/gestaoinventario/api";

/**
 * PROD 
 */
// export const BASE_URL =
//   process.env.REACT_APP_BACKEND_URL ?? "http://10.134.0.165:9007/gestaoinventario/api";

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID ?? config.CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET ?? config.CLIENT_SECRET;

type LoginData = {
  username: string;
  password: string;
};

/**
 * Requisição específica para a funcionalidade de login do back-end
 * @param loginData 
 * @returns 
 */
export const requestBackendLogin = (loginData: LoginData) => {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: "Basic " + window.btoa(CLIENT_ID + ":" + CLIENT_SECRET),
  };

  const data = QueryString.stringify({
    ...loginData,
    grant_type: "password",
  });

  return axios({
    method: "POST",
    baseURL: BASE_URL,
    url: "/oauth/token",
    data,
    headers,
  });
};

/**
 * Requisição genérica para o back-end
 * @param config - AxiosRequestConfig
 * @returns Resposta HTTP
 */
export const requestBackend = (config: AxiosRequestConfig) => {
  const headers = config.withCredentials
    ? {
        ...config.headers,
        Authorization: "Bearer " + getAuthData().access_token,
      }
    : config.headers;

  return axios({ ...config, baseURL: BASE_URL, headers });
};
