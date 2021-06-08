import React, { useEffect, useState } from "react";
import { cloneDeep, get } from "lodash-es";

import classes from "./farm.module.css";
import { useWallet } from "../../store/wallet";
import { FarmInfo, FARMS, getFarmByPoolId } from "../../utils/farms";

import { PoolItem, PoolHeader } from "../../components/pool/pool";
import Switch from "../../components/ui/switch/switch";
import { TokenAmount } from "../../utils/safe-math";
import { useConnection } from "../../store/connection";
import { getStakeAccounts } from "../../store/farm";
import { StakeAccounts } from "../../store/farm";
import LoadingSpinner from "../../components/ui/loading-spinner/loading-spinner";

import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from "../../components/ui/notification/notification";

import * as raydium from "../../utils/raydium";
import { VAULTS } from "../../utils/vault";

interface FarmProps {}

const Farm: React.FC<FarmProps> = () => {
  const connection = useConnection();
  const { tokenAccounts, wallet, connected, updateTokenAccount } = useWallet();

  const [isStakedMode, setIsStakedMode] = useState<boolean>(false);

  const [stakeAccounts, setStakeAccounts] = useState<StakeAccounts>({});

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const toggleStakedModeHandler = () => {
    setIsStakedMode((prevState) => !prevState);
  };

  const getBalance = (mintAddress: string) => {
    const balance = get(tokenAccounts, `${mintAddress}.balance`) as TokenAmount;
    return balance ? balance.fixed() : "0.000000";
  };

  // const getMaxWithdraw = (poolId: string) => {
  //   // @ts-ignore
  //   const balance = get(
  //     stakeAccounts,
  //     `${poolId}.depositBalance`
  //   ) as TokenAmount;
  //   console.log(
  //     "withdraw balance",
  //     balance ? `${balance.fixed()}` : "0.000000"
  //   );
  //   return balance ? `${balance.fixed()}` : "0.000000";
  // };

  const stakeLP = async (currentFarm: FarmInfo, amount: string) => {
    const vault = VAULTS[0];
    const lpAccount = get(
      tokenAccounts,
      `${currentFarm.lp.mintAddress}.tokenAccountAddress`
    );

    const userVaultAccount = get(
      tokenAccounts,
      `${vault.vaultTokenMintAddress}.tokenAccountAddress`
    );

    console.log("LpAccount", lpAccount);
    console.log("vaultAccount", userVaultAccount);

    try {
      notifyInfo();
      const txId = await raydium.deposit(
        connection,
        wallet,
        currentFarm,
        lpAccount,
        userVaultAccount,
        amount
      );
      notifySuccess(txId);

      await updateFarm();
    } catch (err) {
      console.log(err);
      notifyError();
    }
  };

  const withdraw = async (currentFarm: FarmInfo, amount: string) => {
    const lpAccount = get(
      tokenAccounts,
      `${currentFarm.lp.mintAddress}.tokenAccountAddress`
    );
    const userVaultAccount = get(
      tokenAccounts,
      `${currentFarm.vaultTokenMintAddress}.tokenAccountAddress`
    );

    try {
      notifyInfo();
      const txId = await raydium.withdraw(
        connection,
        wallet,
        currentFarm,
        lpAccount,
        userVaultAccount,
        amount
      );
      notifySuccess(txId);
      await updateFarm();
    } catch (err) {
      console.log(err);
      notifyError();
    }
  };

  const updateFarm = async () => {
    console.log("update farm");
    setIsLoading(true);

    // const liquidity = await requestInfos(connection);
    // console.log("liquidity", liquidity);
    // lp mint address: 14Wp3dxYTQpRMMz3AW7f2XGBTdaBrf1qb2NKjAN3Tb13

    // const farms = await getFarmRewardAccount(connection);
    // console.log("farm ", farms);

    const stakeAccounts = await getStakeAccounts(connection, wallet, connected);
    await updateTokenAccount();

    setStakeAccounts((prevState) => {
      return { ...prevState, ...stakeAccounts };
    });

    setIsLoading(false);

    // const price = await getPrices();
    // console.log("price", price);
    // const price = { TEST1: 173.5, TEST2: 200.5 };

    // const results = await updateFarmV2(farms, stakeAccounts, liquidity, price);
    // console.log(results);
    // for (const res of results) {
    //   console.log(res.farmInfo.name);
    //   const pending = (res.userInfo.pendingReward as TokenAmount).fixed();
    //   console.log("pending reward :", pending);
    //   const deposit = (res.userInfo.depositBalance as TokenAmount).fixed();
    //   console.log("deposit :", deposit);
    // }
  };

  useEffect(() => {
    updateFarm();
  }, [wallet, connected]);

  let farm = cloneDeep(FARMS);

  if (isStakedMode) {
    let tmp: FarmInfo[] = [];
    Object.keys(stakeAccounts).forEach((poolId) => {
      const farm = getFarmByPoolId(poolId);
      if (farm) {
        tmp.push(farm);
      }
    });
    farm = tmp;
  }

  const pool = farm.map((farm, index) => (
    <PoolItem
      key={`${farm.name}-${index}`}
      symbol={farm.name}
      mintA={farm.lp.coin.mintAddress}
      mintB={farm.lp.pc.mintAddress}
      depositBalance={getBalance(farm.vaultTokenMintAddress)}
      walletBalance={getBalance(farm.lp.mintAddress)}
      deposit={stakeLP.bind(this, farm)}
      withdraw={withdraw.bind(this, farm)}
    />
  ));

  return (
    <div className={classes.Pool}>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className={classes.SwitchWrapper}>
            <Switch clicked={toggleStakedModeHandler} />
            <span className={classes.Text}>Show Staked</span>
          </div>
          <div className={classes.Table}>
            <PoolHeader />
            {pool}
          </div>
        </>
      )}
    </div>
  );
};

export default Farm;
