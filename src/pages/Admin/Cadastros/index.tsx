import GerenciarContrato from "@/components/GerenciarContrato";
import "./styles.css";
import GerenciarArea from "@/components/GerenciarArea";
import GerenciarUsuario from "@/components/GerenciarUsuario";
import GerenciarUsuarioResponsavel from "@/components/GerenciarUsuarioResponsavel";
import { Link } from "react-router-dom";
import GerenciarFornecedor from "@/components/GerenciarFornecedor";
import { useEffect, useState } from "react";
import { hasAnyRoles } from "@/utils/auth";

const AdminCadastros = () => {
  const [isAnalista, setIsAnalista] = useState<boolean>(false);

  useEffect(() => {
    setIsAnalista(hasAnyRoles([{ id: 2, autorizacao: "PERFIL_ANALISTA_INVENTARIO" }]));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h2 className="page-title">Gerenciamento de Cadastros Auxiliares</h2>
            <span className="page-subtitle">
              Adicione, edite ou remova usuários de sistema, usuários responsáveis, contratos, fornecedores e áreas.
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
        <GerenciarUsuarioResponsavel />
        <GerenciarFornecedor />
        <GerenciarContrato />
        {!isAnalista && <GerenciarUsuario />}
      </div>
    </div>
  );
};

export default AdminCadastros;
