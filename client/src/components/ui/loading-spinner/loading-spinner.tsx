import classes from "./loading-spinner.module.css";

const LoadingSpinner: React.FC = () => {
  return (
    <div className={classes["lds-facebook"]}>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default LoadingSpinner;
