import "./styles.css";
import Loader from "@/components/Loader";
import { requestBackend } from "@/utils/requests";
import { AxiosRequestConfig } from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

type FormData = {
  novaSenha: string;
  confirmarSenha: string;
};

function getPasswordStrength(password: string): "fraca" | "media" | "forte" {
  const lengthScore = password.length >= 8 ? 1 : 0;

  const hasLetters = /[A-Za-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[@$#!*]/.test(password);

  const variationScore = [hasLetters, hasNumbers, hasSymbols].filter(Boolean).length;

  const totalScore = lengthScore + variationScore;

  if (totalScore >= 3) return "forte";
  if (totalScore === 2) return "media";
  return "fraca";
}

const PrimeiroAcesso = () => {
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const fromEmail = searchParams.get("fromEmail");
  const userUuid = searchParams.get("userUuid");
  const token = searchParams.get("token");

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const novaSenhaValue = watch("novaSenha");
  const strength = getPasswordStrength(novaSenhaValue || "");

  const onSubmit = (formData: FormData) => {
    setLoading(true);

    const requestParams: AxiosRequestConfig = {
      url: "/usuarios/senha/primeiro/acesso/trocar",
      method: "POST",
      params: {
        userUuid: userUuid,
        novaSenha: formData.novaSenha,
        token: token,
      },
    };

    requestBackend(requestParams)
      .then((res) => {
        toast.success("Troca de senha efetuada com sucesso.");
        navigate("/gestao-inventario");
      })
      .catch(() => toast.error("Não foi possível realizar a troca da senha."))
      .finally(() => setLoading(false));
  };

  // Essa lógica vai ter que ser melhorada depois
  useEffect(() => {
    let isFromEmail = fromEmail === "true";

    if (!isFromEmail) {
      navigate("/gestao-inventario");
      toast.error("Acesso negado.");
    }
  }, [fromEmail, navigate]);

  return (
    <div className="primeiro-acesso-section">
      <div className="login-welcome">
        <h2>Defina sua senha</h2>
      </div>
      <form className="login-container" onSubmit={handleSubmit(onSubmit)}>
        <div className="login-input-group">
          <div className="login-input-title tooltip-wrapper">
            Nova senha
            <span className="tooltip-icon">
              <i className="bi bi-question-circle" />
            </span>
            <div className="tooltip-box">
              A senha deve conter:
              <ul>
                <li>Mínimo de 6 caracteres</li>
                <li>Somente letras, números e @ $ # ! *</li>
                <li>Sem espaços</li>
              </ul>
            </div>
          </div>
          <input
            type={show ? "text" : "password"}
            id="nova-senha"
            placeholder="Nova senha"
            className={`input-element login-input ${errors.novaSenha ? "input-error" : ""}`}
            {...register("novaSenha", {
              required: "Campo obrigatório",
              pattern: {
                value: /^[A-Za-z0-9@$#!*+]{6,}$/,
                message: "A senha deve ter no mínimo 6 caracteres e conter apenas letras, números e os símbolos @, $, #, !, *",
              },
            })}
          />
          <div className="invalid-feedback d-block div-erro">{errors.novaSenha?.message}</div>
        </div>
        <div className="password-strength">
          {novaSenhaValue && (
            <span className={strength === "forte" ? "strong" : strength === "media" ? "medium" : "weak"}>
              Força da senha: {strength.toUpperCase()}
            </span>
          )}
        </div>
        <div className="login-input-group">
          <span className="login-input-title">Confirmar nova senha</span>
          <input
            type={show ? "text" : "password"}
            id="confirmar-nova-senha"
            onPaste={(e) => e.preventDefault()}
            placeholder="Confirme a nova senha"
            className={`input-element login-input ${errors.confirmarSenha ? "input-error" : ""}`}
            {...register("confirmarSenha", {
              required: "Campo obrigatório",
              validate: (value) => value === novaSenhaValue || "As senhas não coincidem",
            })}
          />
          <button type="button" onClick={() => setShow(!show)} className="password-eye">
            {show ? <i className="bi bi-eye"></i> : <i className="bi bi-eye-slash"></i>}
          </button>
          <div className="invalid-feedback d-block div-erro">{errors.confirmarSenha?.message}</div>
        </div>
        {loading ? (
          <div className="loading-div">
            <Loader />
          </div>
        ) : (
          <>
            <div className="login-input-group">
              <button type="submit" className="button submit-button">
                Salvar
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default PrimeiroAcesso;
