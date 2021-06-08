import React, { useEffect, useState } from "react";
import { NATIVE_SOL, TokenInfo } from "../../utils/tokens";
import { TEST1, TEST_POOL } from "../../utils/pools";
import { getOutAmount, getSwapOutAmount, swap } from "../../utils/swap";
import { useConnection } from "../../store/connection";
import { useWallet } from "../../store/wallet";
import { TokenAmount } from "../../utils/safe-math";
import { confirmTransaction } from "../../utils/transaction";

const Swap: React.FC = () => {
  const connection = useConnection();
  const { wallet } = useWallet();

  const [fromCoin, _setFromCoin] = useState<TokenInfo>(NATIVE_SOL);
  const [toCoin, _setToCoin] = useState<TokenInfo>(TEST1);
  // const [toCoin, _setToCoin] = useState<TokenInfo>(TEST2);

  const [fromCoinAmount, setFromCoinAmount] = useState<string>("");
  const [toCoinAmount, setToCoinAmount] = useState<string>("");

  useEffect(() => {
    const intervalId = setTimeout(() => {
      // updateToCoinAmounts();
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fromCoinAmount]);

  // function updateToCoinAmounts() {
  //   const poolInfo = TEST_POOL;
  //   // const { amountOut, amountOutWithSlippage, priceImpact } = getSwapOutAmount(
  //   //   poolInfo,
  //   //   fromCoin.mintAddress,
  //   //   toCoin.mintAddress,
  //   //   fromCoinAmount,
  //   //   1 // ???????????
  //   // );

  //   // const out = new TokenAmount(amountOut, toCoin.decimals, false)

  //   return amountOut;
  // }

  const fromCoinAmountChangeHandler = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFromCoinAmount(event.target.value);
  };
  const swapHandler = async () => {
    const txid = await swap(
      connection,
      wallet,
      TEST_POOL,
      fromCoin.mintAddress,
      toCoin.mintAddress,
      "Gh6q568T8TY2dGC4j7reXXjZQB7iFJ2U6EiEmXS3LG7e",
      "8fG6vE1Lg2Dcj9X2k4LHvZWDkWQWMjkk3djwRMUPmqNH", // TEST1 Token Account
      // "4VUVkVfKeZyXtngCFbxdux5gcikYSGLWNwjcwnPGBHax" // TEST2 Token Account,
      fromCoinAmount,
      // toCoinAmount
      fromCoinAmount
    );

    console.log("txid : ", txid);
    // confirmTransaction(txid, "hello", connection);
  };

  return (
    <div>
      <label htmlFor="fromCoin">From Coin</label>
      <input
        type="number"
        name="fromCoin"
        placeholder="from coin amount"
        value={fromCoinAmount}
        onChange={fromCoinAmountChangeHandler}
      />
      <label htmlFor="toCoin"> To Coin</label>
      <input
        type="number"
        name="fromCoin"
        placeholder="from coin amount"
        value={toCoinAmount}
        onChange={(event) => setToCoinAmount(event.target.value)}
      />
      <br></br>
      <button onClick={swapHandler}>Swap</button>
    </div>
  );
};

export default Swap;
