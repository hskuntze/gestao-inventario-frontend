import "./styles.css";

/**
 * Componente que é exibido quando o usuário não tem perfil de acesso
 * para determinada funcionalidade do sistema
 */
const Denied = () => {
  return (
    <div className="denied-container">
      <span>ACESSO NEGADO</span>
    </div>
  );
};

export default Denied;
