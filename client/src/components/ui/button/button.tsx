import classes from "./button.module.css";

interface ButtonProps {
  clicked: () => any;
  disabled: boolean;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  clicked,
  disabled,
  children,
  style,
}): JSX.Element => {
  return (
    <button
      className={classes.Btn}
      style={{ ...style }}
      onClick={clicked}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
