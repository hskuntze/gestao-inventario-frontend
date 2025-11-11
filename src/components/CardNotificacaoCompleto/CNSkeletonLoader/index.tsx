import "./styles.css";

const CNSkeletonLoader = () => {
  return (
    <div className="skeleton-card-container cn-skeleton-size">
      <div className="cn-skeleton-icon" />
      <div className="card-info">
        <div className="cn-skeleton-title" />
        <div className="cn-skeleton-message" />
      </div>
    </div>
  );
};

export default CNSkeletonLoader;
