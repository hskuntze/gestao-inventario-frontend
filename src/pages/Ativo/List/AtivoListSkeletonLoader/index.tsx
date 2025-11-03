import "./styles.css";

const AtivoListSkeletonLoader = () => {
  return (
    <div className="div-table">
      <div className="skeleton-card-container ativo-list-table-skeleton-loading">
        <div className="search-bar-skeleton"></div>
        <div className="row-table-skeleton"></div>
        <div className="row-table-skeleton"></div>
        <div className="row-table-skeleton"></div>
      </div>
    </div>
  );
};

export default AtivoListSkeletonLoader;
