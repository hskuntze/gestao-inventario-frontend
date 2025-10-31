import "./styles.css";

const AtivoFormLoaderSkeleton = () => {
  return (
    <div>
      <span>Tipo de ativo</span>
      <div className="skeleton-card-container select-tipo-ativo-skeleton-loading">
        <div className="af-select-skeleton-title" />
      </div>
      <div className="ativo-form-skeleton-body">
        <div className="skeleton-card-container page-content-skeleton-loading">
          <span className="form-title">Informações do Ativo</span>
          <div className="page-content-skeleton-field-large"></div>
          <div className="page-content-skeleton-field"></div>
          <div className="page-content-skeleton-field"></div>
          <div className="page-content-skeleton-field"></div>
          <div className="page-content-skeleton-field"></div>
          <div className="page-content-skeleton-field"></div>
          <div className="page-content-skeleton-field"></div>
          <div className="page-content-skeleton-field"></div>
          <div className="page-content-skeleton-field"></div>
          <div className="page-content-skeleton-field"></div>
          <div className="page-content-skeleton-field"></div>
          <div className="page-content-skeleton-field-large"></div>
        </div>
        <div className="skeleton-card-container page-side-section-skeleton-loading">
          <span className="form-title">Histórico do Ativo</span>
          <div className="page-content-skeleton-field"></div>
        </div>
      </div>
    </div>
  );
};

export default AtivoFormLoaderSkeleton;
