import Button from "../../../ui/button/button";

interface DropdownItemProps {
  clicked: () => void;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ clicked, children }) => {
  return (
    <Button
      style={{ border: "none", borderRadius: "0px" }}
      clicked={clicked}
      disabled={false}
    >
      {children}
    </Button>
  );
};

export default DropdownItem;
