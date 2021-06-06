import React, { useEffect, useState } from "react";
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
import { StakeAccounts } from "../../store/farm";
import LoadingSpinner from "../../components/ui/loading-spinner/loading-spinner";
import { toast } from "react-toastify";

import { notifyInfo } from "../../components/ui/notification/notification";

interface FarmProps {}

// const DEFAULT_FARM = cloneDeep(FARMS[0])
// const DEFAULT_LP = cloneDeep(FARMS[0].lp)
const Farm: React.FC<FarmProps> = () => {
  const connection = useConnection();
  const { tokenAccounts, wallet, connected } = useWallet();

  const [isStakedMode, setIsStakedMode] = useState<boolean>(false);

  const [stakeAccounts, setStakeAccounts] = useState<StakeAccounts>({});

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // TODO: clean up farm state management
  const [showStakeModal, setShowStakeModal] = useState<boolean>(false);

  const toggleStakedModeHandler = () => {
    setIsStakedMode((prevState) => !prevState);
  };

  const getBalance = (mintAddress: string) => {
    const balance = get(tokenAccounts, `${mintAddress}.balance`) as TokenAmount;
    return balance ? balance.fixed() : "0.000000";
  };
  // TODO: clean up farm state management
  // const selectFarmHandler = (farm: FarmInfo) => {
  //   setCurrentFarm(farm);
  // };

  // };

  // stake lp
  // const stakeLP = async (farm: FarmInfo, amount: string) => {
  const stakeLP = async (currentFarm: FarmInfo, amount: string) => {
    const lpAccount = get(
      tokenAccounts,
      `${currentFarm.lp.mintAddress}.tokenAccountAddress`
    );
    const rewardAccount = get(
      tokenAccounts,
      `${currentFarm.reward.mintAddress}.tokenAccountAddress`
    );
    const rewardAccountB = get(
      tokenAccounts,
      `${currentFarm.rewardB!.mintAddress}.tokenAccountAddress`
    );

    const infoAccount = get(
      stakeAccounts,
      `${currentFarm.poolId}.stakeAccountAddress`
    );

    console.log("LpAccount", lpAccount);
    console.log("rewardAccount", rewardAccount);
    console.log("rewardAccountB", rewardAccountB);
    console.log("infoAccount", infoAccount);

    const txId = await depositV4(
      connection,
      wallet,
      currentFarm,
      lpAccount,
      rewardAccount,
      rewardAccountB,
      // @ts-ignore
      infoAccount,
      amount
    );
    // console.log("Tx :", tx);

    notifyInfo(txId);
    confirmTransaction(txId, connection);
  };

  const withdraw = async (farm: FarmInfo, amount: string) => {
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

    const infoAccount = get(
      stakeAccounts,
      `${farm.poolId}.stakeAccountAddress`
    );

    const txId = await withdrawV4(
      connection,
      wallet,
      farm,
      lpAccount,
      rewardAccount,
      rewardAccountB,
      //@ts-ignore
      infoAccount,
      amount
    );

    notifyInfo(txId);
    confirmTransaction(txId, connection);
  };

  const updateFarm = async () => {
    console.log("update farm");
    setIsLoading(true);
    const farm = FARMS[0];
    // getFarmRewardAccount(connection);
    const liquidity = await requestInfos(connection);
    console.log("liquidity", liquidity);

    // const farms = await getFarmRewardAccount(connection);
    // console.log("farm ", farms);

    const stakeAccounts = await getStakeAccounts(connection, wallet, connected);
    console.log("stake account ", stakeAccounts);

    // const price = await getPrices();
    // console.log("price", price);

    // const results = await updateFarms(farms, stakeAccounts, liquidity, price);
    // console.log(results);
    // for (const res of results) {
    //   console.log(res.farmInfo.name);
    //   const pending = (res.userInfo.pendingReward as TokenAmount).fixed();
    //   console.log("pending reward :", pending);
    //   const deposit = (res.userInfo.depositBalance as TokenAmount).fixed();
    //   console.log("deposit :", deposit);
    // }

    return stakeAccounts;
  };

  useEffect(() => {
    updateFarm().then((stakeAccounts) => {
      setIsLoading(false);
      setStakeAccounts((prevState) => {
        return { ...prevState, ...stakeAccounts };
      });
    });
  }, [wallet, connected]);

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
      withdraw={withdraw.bind(this, farm)}
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
      {isLoading ? <LoadingSpinner /> : null}
      {/* <button onClick={stakeLP}>STAKE LP</button> */}
      {/* <button onClick={withDraw}>WITHDRAW LP</button> */}
    </div>
  );
};

export default Farm;
