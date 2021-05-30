import classes from "./switch.module.css";

type SwitchProps = {
  clicked: () => any;
};

const Switch: React.FC<SwitchProps> = ({ clicked }) => {
  return (
    <label className={classes.Switch}>
      <input className={classes.Input} type="checkbox" onClick={clicked} />
      <span className={`${classes.Slider} ${classes.Round}`}></span>
    </label>
  );
};

export default Switch;
