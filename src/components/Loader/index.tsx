import { PropagateLoader } from "react-spinners";

interface Props {
  loading?: boolean;
}

const Loader = ({ loading }: Props) => {
  return (
    <PropagateLoader color="#007AFF" loading={true} size={10}  />
  );
};

export default Loader;
