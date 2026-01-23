import "./styles.css";

import { requestBackend } from "@/utils/requests";
import { AxiosRequestConfig } from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import GestInvIcone from "@/assets/images/Marca_Principal_Escuro.png";
import Loader from "@/components/Loader";
import { Link } from "react-router-dom";

type FormData = {
  email: string;
};

const EsqueciMinhaSenha = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<FormData>();

  const onSubmit = (formData: FormData) => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/usuarios/password/recover/user",
      method: "POST",
      params: {
        email: formData.email,
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success("O link para recuperação de senha foi enviado por e-mail. Verifique sua caixa de entrada.");
      })
      .catch((err) => {
        let message = err.response?.data?.message;
        toast.error(message ? message : "Erro ao tentar enviar o e-mail de recuperação de senha.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="login-page">
      <img src={GestInvIcone} alt="Ícone Gestão Inventário" />
      <div className="login-welcome">
        <h2>Recuperação de Senha</h2>
        <span>Informe seu e-mail para recuperar a senha</span>
      </div>
      <form className="login-container" onSubmit={handleSubmit(onSubmit)}>
        <div className="login-input-group">
          <span className="login-input-title">E-mail</span>
          <input
            type="text"
            className={`input-element login-input ${errors.email ? "input-error" : ""}`}
            {...register("email", {
              required: "Campo obrigatório",
              pattern: {
                value: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                message: "E-mail inválido",
              },
            })}
            placeholder="E-mail cadastrado no sistema"
            maxLength={255}
          />
          <div className="invalid-feedback d-block div-erro">{errors.email?.message}</div>
        </div>
        {loading ? (
          <div className="loading-div">
            <Loader />
          </div>
        ) : (
          <>
            <div className="login-input-group esqueci-minha-senha-buttons">
              <Link to={"/gestao-inventario/login"} type="button" className="button submit-button voltar-button">
                Voltar
              </Link>
              <button type="submit" className="button submit-button">
                Enviar
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default EsqueciMinhaSenha;
