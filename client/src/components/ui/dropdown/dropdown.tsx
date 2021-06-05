import classes from "./dropdown.module.css";

const Dropdown: React.FC = () => {
  return (
    <div className={classes.Dropdown}>
      <span>Mouse over me</span>
      <div className={classes.DropdownContent}>
        <p>Hello World!</p>
      </div>
    </div>
  );
};

export default Dropdown;
