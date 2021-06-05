import { useState } from "react";
import { cloneDeep, get } from "lodash-es";

import classes from "./farm.module.css";
import { useWallet } from "../../store/wallet";
import {
  FarmInfo,
  FARMS,
  getFarmByLpMintAddress,
  getFarmRewardAccount,
} from "../../utils/farms";

import { PoolItem, PoolHeader } from "../../components/pool/pool";
import Switch from "../../components/ui/switch/switch";
import { TokenAmount } from "../../utils/safe-math";
import { useConnection } from "../../store/connection";
import { getPrices } from "../../store/price";
import { requestInfos } from "../../store/liquidity";
import { updateFarms } from "./user";
import { getStakeAccounts } from "../../store/farm";
import { depositV4, withdrawV4 } from "../../utils/stake";
import { confirmTransaction } from "../../utils/transaction";

interface FarmProps {}

// const DEFAULT_FARM = cloneDeep(FARMS[0])
// const DEFAULT_LP = cloneDeep(FARMS[0].lp)
const Farm: React.FC<FarmProps> = () => {
  const connection = useConnection();
  const { tokenAccounts, wallet, connected } = useWallet();

  const [isStakedMode, setIsStakedMode] = useState<boolean>(false);

  const toggleStakedModeHandler = () => {
    setIsStakedMode((prevState) => !prevState);
  };

  const getBalance = (mintAddress: string) => {
    const balance = get(tokenAccounts, `${mintAddress}.balance`) as TokenAmount;
    return balance ? balance.fixed() : "0.000000";
  };

  // };

  // stake lp
  const stakeLP = async (farm: FarmInfo) => {
    const lpAccount = get(
      tokenAccounts,
      `${farm.lp.mintAddress}.tokenAccountAddress`
    );
    const rewardAccount = get(
      tokenAccounts,
      `${farm.reward.mintAddress}.tokenAccountAddress`
    );
    const rewardAccountB = get(
      tokenAccounts,
      `${farm.rewardB!.mintAddress}.tokenAccountAddress`
    );
    // // TODO:  stake account address
    // const infoA = "ABcqFsuBWfHtMmSBrYiVKQwpngMg7GUFaKsWViEKFiup";
    // const infoB = "4Mk9DtUksdhgb7vt3g5ssoUSM76vs36BfagNKC7NdG8i";
    // const infoC = "Q3euXfw74FA9FyowwkRtPniVtqH3UQhrkeKYk9FK6KQ";
    const tx = await depositV4(
      connection,
      wallet,
      farm,
      lpAccount,
      rewardAccount,
      rewardAccountB,
      null,
      "1"
    );
    console.log("Tx :", tx);
    confirmTransaction(tx, "hello", connection);
  };

  const withDraw = async () => {
    const infoA = "ABcqFsuBWfHtMmSBrYiVKQwpngMg7GUFaKsWViEKFiup";
    const farm = FARMS[0];

    const lpAccount = get(
      tokenAccounts,
      `${farm.lp.mintAddress}.tokenAccountAddress`
    );
    const rewardAccount = get(
      tokenAccounts,
      `${farm.reward.mintAddress}.tokenAccountAddress`
    );
    const rewardAccountB = get(
      tokenAccounts,
      `${farm.rewardB!.mintAddress}.tokenAccountAddress`
    );

    const tx = await withdrawV4(
      connection,
      wallet,
      farm,
      lpAccount,
      rewardAccount,
      rewardAccountB,
      infoA,
      "1"
    );

    console.log("Tx :", tx);
    confirmTransaction(tx, "hello", connection);
  };

  const updateFarm = async () => {
    // getFarmRewardAccount(connection);
    // const liquidity = await requestInfos(connection);
    // console.log("liquidity", liquidity);

    // const farms = await getFarmRewardAccount(connection);
    // console.log("farm ", farms);

    const stakeAcc = await getStakeAccounts(connection, wallet, connected);
    console.log("stake acc: ", stakeAcc);

    // const price = await getPrices();

    // const results = await updateFarms(farms, stakeAcc, liquidity, price);
    // console.log(results);
    // for (const res of results) {
    //   console.log(res.farmInfo.name);
    //   const pending = (res.userInfo.pendingReward as TokenAmount).fixed();
    //   console.log("pending reward :", pending);
    //   const deposit = (res.userInfo.depositBalance as TokenAmount).fixed();
    //   console.log("deposit :", deposit);
    // }
  };

  let farm = cloneDeep(FARMS);

  if (isStakedMode) {
    let tmp: FarmInfo[] = [];
    Object.keys(tokenAccounts).forEach((mintAddress) => {
      const farm = getFarmByLpMintAddress(mintAddress);
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
      walletBalance={getBalance(farm.lp.mintAddress)}
      deposit={stakeLP.bind(this, farm)}
    />
  ));

  return (
    <div className={classes.Pool}>
      <div className={classes.SwitchWrapper}>
        <Switch clicked={toggleStakedModeHandler} />
        <span className={classes.Text}>Show Staked</span>
      </div>
      <div className={classes.Table}>
        <PoolHeader />
        {pool}
      </div>
      {/* <button onClick={stakeLP}>STAKE LP</button> */}
      {/* <button onClick={withDraw}>WITHDRAW LP</button> */}
      {/* <button onClick={updateFarm}>UPDATE FARM</button> */}
    </div>
  );
};

export default Farm;
