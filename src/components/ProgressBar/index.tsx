import "./styles.css";

interface Props {
  value: number;
  total: number;
}

const ProgressBar = ({ total, value }: Props) => {
  const percent = Math.min(100, (value / total) * 100);

  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
};

export default ProgressBar;
