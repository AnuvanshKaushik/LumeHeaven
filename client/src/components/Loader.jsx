const Loader = ({ text = "Loading..." }) => (
  <div className="loader">
    <span className="spinner" aria-hidden="true" />
    <span>{text}</span>
  </div>
);

export default Loader;
