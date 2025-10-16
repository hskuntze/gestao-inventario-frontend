import "./styles.css";

const CARSkeletonLoader = () => {
  return (
    <div className="skeleton-card-container car-skeleton-size">
      <div className="car-skeleton-icon" />
      <div className="card-info">
        <div className="car-skeleton-title" />
      </div>
    </div>
  );
};

export default CARSkeletonLoader;
