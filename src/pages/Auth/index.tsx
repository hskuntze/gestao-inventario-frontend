import "./styles.css";

import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { AxiosRequestConfig } from "axios";

import GestInvIcone from "@/assets/images/Marca_Principal_Escuro.png";

import { AuthContext } from "@/utils/contexts/AuthContext";
import { requestBackend, requestBackendLogin } from "@/utils/requests";
import { saveAuthData, saveUserData } from "@/utils/storage";
import { getTokenData } from "@/utils/auth";

import Loader from "@/components/Loader";

import { User } from "@/types/user";

type FormData = {
  username: string;
  password: string;
};

const Auth = () => {
  const { setAuthContextData } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const loadUserInfo = () => {
    const requestParams: AxiosRequestConfig = {
      url: "/usuarios/authenticated/info",
      method: "GET",
      withCredentials: true,
    };

    requestBackend(requestParams)
      .then((res) => {
        let data = res.data as User;
        saveUserData(data);

        if (data.firstAccess) {
          navigate("/gestao-inventario/primeiro-acesso");
        } else {
          navigate("/gestao-inventario");
        }
      })
      .catch(() => {
        toast.error("Erro ao tentar resgatar os dados do usuário.");
      });
  };

  const onSubmit = (formData: FormData) => {
    setLoading(true);

    requestBackendLogin(formData)
      .then((res) => {
        saveAuthData(res.data);

        setAuthContextData({
          authenticated: true,
          tokenData: getTokenData(),
        });

        loadUserInfo();
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="login-page">
      <img src={GestInvIcone} alt="Ícone Gestão Inventário" />
      <div className="login-welcome">
        <h2>Acesse sua conta</h2>
        <span>Bem-vindo a Gestão de Inventário da CTCEA</span>
      </div>
      <form className="login-container" onSubmit={handleSubmit(onSubmit)}>
        <div className="login-input-group">
          <span className="login-input-title">Nome de usuário</span>
          <input
            type="text"
            id="login-username"
            placeholder="Nome de usuário"
            className={`input-element login-input ${errors.username ? "input-error" : ""}`}
            {...register("username", {
              required: "Campo obrigatório",
            })}
          />
          <div className="invalid-feedback d-block div-erro">{errors.username?.message}</div>
        </div>
        <div className="login-input-group">
          <span className="login-input-title">Senha</span>
          <input
            type={show ? "text" : "password"}
            id="login-password"
            placeholder="Sua senha"
            className={`input-element login-input ${errors.password ? "input-error" : ""}`}
            {...register("password", {
              required: "Campo obrigatório",
            })}
          />
          <button type="button" onClick={() => setShow(!show)} className="password-eye">
            {show ? <i className="bi bi-eye"></i> : <i className="bi bi-eye-slash"></i>}
          </button>
          <div className="invalid-feedback d-block div-erro">{errors.password?.message}</div>
        </div>
        {loading ? (
          <div className="loading-div">
            <Loader />
          </div>
        ) : (
          <>
            <div className="login-input-group">
              <button type="submit" className="button submit-button">
                Entrar
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default Auth;
