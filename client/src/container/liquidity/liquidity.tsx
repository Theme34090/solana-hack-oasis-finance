import React, { useEffect, useState } from "react";
import { useConnection } from "../../store/connection";
import { useWallet } from "../../store/wallet";

import { TOKENS, TokenInfo, LP_TOKENS, NATIVE_SOL } from "../../utils/tokens";
import { addLiquidity, addLiquidityAnchor } from "../../utils/liquidity";
import { TEST_POOL, TEST_LPTOKEN } from "../../utils/pools";
import { confirmTransaction } from "../../utils/transaction";
import { get } from "lodash-es";

// https://github.com/solana-labs/token-list
import styled from "styled-components";
import { notifyInfo } from "../../components/ui/notification/notification";

const Form = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FormGroup = styled.div`
  margin: 2rem;
`;

const Button = styled.button`
  margin: 2rem;
  width: 10%;
`;

const Liquidity: React.FC = () => {
  const connection = useConnection();
  const { wallet, tokenAccounts } = useWallet();

  const [fromCoin, _setFromCoin] = useState<TokenInfo>(
    TOKENS.TEST1 as TokenInfo
  );
  const [fromAmount, setFromAmount] = useState<string>("");

  const [toCoin, _setToCoin] = useState<TokenInfo>(TOKENS.TEST2);
  const [toAmount, setToAmount] = useState<string>("");

  const fromAmountChangeHandler = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFromAmount(event.target.value);
  };

  const toAmountChangeHandler = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setToAmount(event.target.value);
  };

  const addLiquidityHandler = async () => {
    const lp = TEST_LPTOKEN["TEST"];

    const fromCoinAccount = get(
      tokenAccounts,
      `${fromCoin.mintAddress}.tokenAccountAddress`
    );
    const toCoinAccount = get(
      tokenAccounts,
      `${toCoin.mintAddress}.tokenAccountAddress`
    );

    const lpAccount = get(
      tokenAccounts,
      `${lp.mintAddress}.tokenAccountAddress`
    );

    const txId = await addLiquidity(
      connection,
      wallet,
      TEST_POOL,
      fromCoinAccount,
      toCoinAccount,
      lpAccount,
      fromCoin,
      toCoin,
      fromAmount,
      toAmount,
      ""
    );

    console.log("txId : ", txId);
    notifyInfo(txId);
    confirmTransaction(txId, connection);
  };

  useEffect(() => {
    for (let key in tokenAccounts) {
      console.log(
        `${tokenAccounts[key].tokenAccountAddress} : ${tokenAccounts[
          key
        ].balance.fixed()}`
      );
    }
  }, [tokenAccounts]);

  return (
    <Form>
      <FormGroup>
        <label> From : </label>
        <input
          type="number"
          value={fromAmount}
          onChange={fromAmountChangeHandler}
        />
        <p>BEcGFQK1T1tSu3kvHC17cyCkQ5dvXqAJ7ExB2bb5Do7a</p>
        {/* <p>current balance: {fromCoin.balance ? fromCoin.balance : "0"}</p> */}
      </FormGroup>
      <FormGroup>
        <label> To : </label>
        <input
          type="number"
          value={toAmount}
          onChange={toAmountChangeHandler}
        />
        <p>FSRvxBNrQWX2Fy2qvKMLL3ryEdRtE3PUTZBcdKwASZTU</p>
      </FormGroup>
      <Button onClick={addLiquidityHandler}>Add Liquidity</Button>
    </Form>
  );
};

export default Liquidity;
