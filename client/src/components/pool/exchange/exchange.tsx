import React, { useEffect, useReducer } from "react";
import { useWallet } from "../../../store/wallet";
import Button from "../../ui/button/button";
import classes from "./exchange.module.css";

type InputState = {
  value: string;
  max: number;
  isValid: boolean;
};

enum ActionType {
  UserInput = "USER_INPUT",
  InputBlur = "INPUT_BLUR",
  MaxChange = "MAX_CHANGE",
}

type InputAction = {
  type: ActionType;
  value?: string;
  max?: number;
};

const isValidInput = (value: string, max: number) => {
  const amount = +value;
  const isNumber = !isNaN(amount);
  if (!isNumber || amount < 0) return false;
  return amount <= max;
};

const inputReducer = (
  prevState: InputState,
  action: InputAction
): InputState => {
  switch (action.type) {
    case ActionType.UserInput:
      return {
        value: action.value || "",
        isValid: action.value
          ? isValidInput(action.value, prevState.max)
          : false,
        max: prevState.max,
      };
    case ActionType.InputBlur:
      return {
        value: prevState.value,
        isValid: isValidInput(prevState.value, prevState.max),
        max: prevState.max,
      };
    case ActionType.MaxChange:
      return {
        value: prevState.value,
        isValid: isValidInput(prevState.value, prevState.max),
        max: action.max || 0,
      };
    default:
      return { value: "", isValid: false, max: prevState.max };
  }
};

type ViewProps = {
  clicked: (value: string) => any;
  max: string;
  symbol: string;
};

const View: React.FC<ViewProps> = ({ symbol, max, clicked, children }) => {
  const { connected } = useWallet();
  const [inputState, dispatchInput] = useReducer(inputReducer, {
    value: "0.00",
    isValid: false,
    max: !isNaN(+max) ? +max : 0,
  });
  const { isValid } = inputState;

  const inputChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatchInput({ type: ActionType.UserInput, value: event.target.value });
  };

  const validateInputHandler = () => {
    dispatchInput({ type: ActionType.InputBlur });
  };

  const onMax = () => {
    dispatchInput({ type: ActionType.UserInput, value: max });
  };

  useEffect(() => {
    dispatchInput({ type: ActionType.MaxChange, max: !isNaN(+max) ? +max : 0 });
  }, [max]);

  return (
    <div className={classes.Expanded}>
      <div className={classes.InputWrapper}>
        <input
          type="number"
          placeholder="Enter deposit amount..."
          value={inputState.value}
          onChange={inputChangeHandler}
          onBlur={validateInputHandler}
        />
        <div className={classes.MaxBtn} onClick={onMax}>
          MAX
        </div>
        <div className={classes.TokenSymbol}>{symbol}</div>
      </div>
      <Button
        clicked={() => clicked(inputState.value)}
        disabled={!isValid || !connected}
      >
        {children}
      </Button>
    </div>
  );
};

interface ExchangeProps {
  show: boolean;
  maxLp: string;
  symbol: string;
  deposit: (amount: string) => any;
}

const Exchange: React.FC<ExchangeProps> = ({
  symbol,
  maxLp,
  deposit,
  show,
}) => {
  const withdrawnHandler = (amount: string) => {
    console.log("withdrawn: ", amount);
  };

  const baseTableClasses = [classes.BaseTable];
  if (show) {
    baseTableClasses.push(classes.Open);
  }

  return (
    <div className={baseTableClasses.join(" ")}>
      <p className={classes.Fee}>Fees</p>
      <View symbol={symbol} max={maxLp} clicked={deposit}>
        Deposit
      </View>
      <View symbol={symbol} max={maxLp} clicked={withdrawnHandler}>
        Withdrawn
      </View>
    </div>
  );
};

export default Exchange;
