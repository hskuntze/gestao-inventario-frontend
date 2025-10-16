import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";

import "./styles.css";

import GestInvIcone from "@/assets/images/Gestao_Inventario_Icone.png";

import { AuthContext } from "@/utils/contexts/AuthContext";
import { requestBackendLogin } from "@/utils/requests";
import { saveAuthData } from "@/utils/storage";
import { getTokenData } from "@/utils/auth";

import Loader from "@/components/Loader";

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

  const onSubmit = (formData: FormData) => {
    setLoading(true);

    requestBackendLogin(formData)
      .then((res) => {
        saveAuthData(res.data);
        setAuthContextData({
          authenticated: true,
          tokenData: getTokenData(),
        });

        navigate("/gestao-inventario");
      })
      .catch((err) => {
        toast.error("Não foi possível realizar o login. Tente novamente mais tarde.");
      })
      .finally(() => {
        setLoading(false);
      });
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
            placeholder="Nome de usuário do SAFE"
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
            placeholder="Sua senha do SAFE"
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
