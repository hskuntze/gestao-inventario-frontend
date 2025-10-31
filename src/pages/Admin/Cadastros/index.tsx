import GerenciarArea from "@/components/GerenciarArea";
import "./styles.css";

const AdminCadastros = () => {
  return (
    <div className="page">
      <div className="page-header">
        <div className="header-content">
          <h2 className="page-title">Gerenciamento de Cadastros Auxiliares</h2>
        </div>
        <span className="page-subtitle">Adicione, edite ou remova usuários, fornecedores e áreas.</span>
      </div>
      <div className="page-body w-100">
        <GerenciarArea />
      </div>
    </div>
  );
};

export default AdminCadastros;
