import React, { useReducer } from "react";
import { useWallet } from "../../../store/wallet";
import Button from "../../ui/button/button";
import classes from "./exchange.module.css";

type InputState = {
  value: string;
  isValid: boolean;
};

enum ActionType {
  UserInput = "USER_INPUT",
  InputBlur = "INPUT_BLUR",
}

type InputAction = {
  type: ActionType;
  value?: string;
};

const isValidInput = (value: string) => {
  return !isNaN(+value) && +value > 0;
};

const inputReducer = (
  prevState: InputState,
  action: InputAction
): InputState => {
  switch (action.type) {
    case ActionType.UserInput:
      return {
        value: action.value || "",
        isValid: action.value ? isValidInput(action.value) : false,
      };
    case ActionType.InputBlur:
      return { value: prevState.value, isValid: isValidInput(prevState.value) };
    default:
      return { value: "", isValid: false };
  }
};

type ViewProps = {
  clicked: (value: number) => any;
};

const View: React.FC<ViewProps> = ({ clicked, children }) => {
  const { connected } = useWallet();
  const [inputState, dispatchInput] = useReducer(inputReducer, {
    value: "",
    isValid: false,
  });
  const { isValid } = inputState;

  const inputChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatchInput({ type: ActionType.UserInput, value: event.target.value });
  };

  const validateInputHandler = () => {
    dispatchInput({ type: ActionType.InputBlur });
  };

  return (
    <div className={classes.Expanded}>
      <input
        type="number"
        placeholder="Enter deposit amount..."
        value={inputState.value}
        onChange={inputChangeHandler}
        onBlur={validateInputHandler}
      />
      <Button
        clicked={() => clicked(+inputState.value)}
        disabled={!isValid || !connected}
      >
        {children}
      </Button>
    </div>
  );
};

const Exchange: React.FC = () => {
  const depositHandler = (amount: number) => {
    console.log("deposit: ", amount);
  };

  const withdrawnHandler = (amount: number) => {
    console.log("withdrawn: ", amount);
  };

  return (
    <div className={classes.BaseTable}>
      <p className={classes.Fee}>Fees</p>
      <View clicked={depositHandler}>Deposit</View>
      <View clicked={withdrawnHandler}>Withdrawn</View>
    </div>
  );
};

export default Exchange;
