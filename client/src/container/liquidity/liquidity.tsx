import React, { useEffect, useState } from "react";
import { useConnection } from "../../store/connection";
import { useWallet } from "../../store/wallet";

import { TOKENS, TokenInfo, LP_TOKENS, NATIVE_SOL } from "../../utils/tokens";
import { getTokenAccounts } from "../../utils/wallet";
import {
  createTokenAccountIfNotExist,
  sendTransaction,
} from "../../utils/web3";
import { addLiquidity } from "../../utils/liquidity";
import { TEST_POOL, TEST_LPTOKEN } from "../../utils/pools";
import { confirmTransaction } from "../../utils/transaction";
import { get } from "lodash-es";
import { Transaction } from "@solana/web3.js";
import { TokenAmount } from "../../utils/safe-math";

// https://github.com/solana-labs/token-list
import {
  TokenListProvider,
  TokenInfo as TInfo,
} from "@solana/spl-token-registry";

const Liquidity: React.FC = () => {
  const connection = useConnection();
  const { wallet } = useWallet();

  const [tokenAccounts, setTokenAccounts] = useState<any>({});

  const [fromCoin, setFromCoin] = useState<TokenInfo>(
    TOKENS.TEST1 as TokenInfo
  );
  const [fromAmount, setFromAmount] = useState<string>("");

  const [toCoin, setToCoin] = useState<TokenInfo>(TOKENS.TEST2);
  const [toAmount, setToAmount] = useState<string>("");

  // useEffect(() => {
  //   new TokenListProvider().resolve().then((tokens) => {
  //     const tokenList = tokens.filterByClusterSlug("testnet").getList();
  //     console.log(tokenList);
  //   });
  // }, []);

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

  const getTokenAccountsHandler = () => {
    getTokenAccounts(connection, wallet).then((tkAcc) => {
      setTokenAccounts(tkAcc);
    });
  };

  const addTokenHandler = () => {
    const lp = LP_TOKENS["TEST_LPTOKEN"];

    const userAmounts = [fromAmount, toAmount];
    const coinAmount = new TokenAmount(
      userAmounts[0],
      lp!.coin!.decimals,
      false
    ).wei.toNumber();
    console.log("before add token: ", coinAmount);
    const transaction = new Transaction();
    const signers: any = [];
    let account;

    createTokenAccountIfNotExist(
      connection,
      account,
      wallet.publicKey,
      // TOKENS.RAY.mintAddress,
      // "CpMah17kQEL2wqyMKt3mZBdTnZbkbfx4nqmQMFDP5vwp",
      "FSRvxBNrQWX2Fy2qvKMLL3ryEdRtE3PUTZBcdKwASZTU", //pool_pc_token_account
      // "BEcGFQK1T1tSu3kvHC17cyCkQ5dvXqAJ7ExB2bb5Do7a", // pool_coin_token_account
      coinAmount + 1e7,
      transaction,
      signers
    )
      .then((pk) => {
        return sendTransaction(connection, wallet, transaction, signers);
      })
      .then((result) => {
        console.log("txid: ", result);
        confirmTransaction(result, "hello", connection);
      });
  };

  const addLiquidityHandler = () => {
    // console.log("wallet : ", tokenAccounts);
    // console.log("fromCoin : ", fromCoin.mintAddress);
    // console.log("toCoin : ", toCoin.mintAddress);
    // const lp = getPoolByLpMintAddress(LP_TOKENS["RAY-SOL"].mintAddress);
    const lp = TEST_LPTOKEN["TEST"];

    // console.log("pool info: ", lp);

    // const fromCoinAccount = "8fG6vE1Lg2Dcj9X2k4LHvZWDkWQWMjkk3djwRMUPmqNH";
    // const toCoinAccount = "8Uv5BX3bfnqPbwcucxi3PsbVMHNZ3jsvf8r3jektw3U6";

    const fromCoinAccount = get(
      tokenAccounts,
      `${fromCoin.mintAddress}.tokenAccountAddress`
    );
    console.log(
      "🚀 ~ file: liquidity.tsx ~ line 47 ~ addLiquidityHandler ~ fromCoinAccount",
      fromCoinAccount
    );
    const toCoinAccount = get(
      tokenAccounts,
      `${toCoin.mintAddress}.tokenAccountAddress`
    );
    console.log(
      "🚀 ~ file: liquidity.tsx ~ line 49 ~ addLiquidityHandler ~ toCoinAccount",
      toCoinAccount
    );
    const lpAccount = get(
      tokenAccounts,
      `${lp.mintAddress}.tokenAccountAddress`
    );
    console.log(
      "🚀 ~ file: liquidity.tsx ~ line 50 ~ addLiquidityHandler ~ lpAccount",
      lpAccount
    );

    // const userAmounts = [fromAmount, toAmount];
    // const coinAmount = new TokenAmount(
    //   userAmounts[0],
    //   lp!.coin!.decimals,
    //   false
    // ).wei.toNumber();
    // const transaction = new Transaction();
    // const signers: any = [];
    // let account;

    addLiquidity(
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
    )
      .then((txid) => {
        console.log("txid :", txid);
        confirmTransaction(txid, "Hello", connection);
      })
      .catch((error) => {
        console.error(error);
        alert("add liquidity failed");
      });
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
    <>
      <div>
        <label> From : </label>
        <input
          type="number"
          value={fromAmount}
          onChange={fromAmountChangeHandler}
        />
        <p>current balance: {fromCoin.balance ? fromCoin.balance : "0"}</p>
        <button
          onClick={() => {
            setFromAmount(fromCoin.balance ? fromCoin.balance.fixed() : "");
          }}
        >
          MAX
        </button>
      </div>
      <div>
        <label> To : </label>
        <input
          type="number"
          value={toAmount}
          onChange={toAmountChangeHandler}
        />
      </div>
      <button onClick={getTokenAccountsHandler}>get Token Accounts</button>
      <button onClick={addTokenHandler}>ADD Token Accounts</button>
      <button onClick={addLiquidityHandler}>Add Liquidity</button>
    </>
  );
};

export default Liquidity;
