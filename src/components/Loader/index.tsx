import PropagateLoader from "react-spinner";

interface Props {
  width?: string;
  height?: string;
}

const Loader = ({ height, width }: Props) => {
  return (
    <PropagateLoader />
  );
};

export default Loader;
