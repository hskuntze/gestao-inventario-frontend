import GerenciarContrato from "@/components/GerenciarContrato";
import "./styles.css";
import GerenciarArea from "@/components/GerenciarArea";
import GerenciarUsuarioResponsavel from "@/components/GerenciarUsuarioResponsavel";
import { Link, useNavigate } from "react-router-dom";
import GerenciarFornecedor from "@/components/GerenciarFornecedor";

const AdminCadastros = () => {
  const navigate = useNavigate();

  const handleReloadPage = () => {
    navigate(0);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h2 className="page-title">Cadastros Auxiliares</h2>
            <span className="page-subtitle">
              Adicione, edite ou remova usuários, contratos, fornecedores e setores.
            </span>
          </div>
          <div className="header-content-buttons">
            <Link to="/gestao-inventario" type="button" className="voltar-button">
              Voltar
            </Link>
          </div>
        </div>
      </div>
      <div className="page-body w-100">
        <GerenciarArea />
        <GerenciarUsuarioResponsavel reloadPage={handleReloadPage} />
        <GerenciarFornecedor reloadPage={handleReloadPage} />
        <GerenciarContrato />
      </div>
    </div>
  );
};

export default AdminCadastros;
