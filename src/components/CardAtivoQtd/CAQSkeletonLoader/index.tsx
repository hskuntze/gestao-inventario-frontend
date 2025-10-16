import "./styles.css";

const CAQSkeletonLoader = () => {
  return (
    <div className="skeleton-card-container caq-skeleton-size">
      <div className="caq-skeleton-title" />
      <div className="caq-skeleton-number" />
      <div className="caq-skeleton-progress-bar" />
    </div>
  );
};

export default CAQSkeletonLoader;
