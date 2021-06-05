import { useEffect, useState } from "react";
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
    return balance ? balance.fixed() : "dummy balance";
  };

  const getPendingRewards = (farmInfo: FarmInfo) => {
    if ([4, 5].includes(farmInfo.version)) {
      let userInfo = {}; // get(this.farm.stakeAccounts, poolId)
    }
  };

  // const updateCurrentLp = (tokenAccounts: any) => {
  //   if (lp) {
  //     const coin = cloneDeep(lp);
  //     const lpBalance = get(tokenAccounts, `${lp.mintAddress}.balance`);
  //     coin.balance = lpBalance;

  //     setLp(coin);
  //   }
  // };

  // stake lp
  const stakeLP = (coinAddress: string, pcAddress: string, amount: string) => {
    console.log(coinAddress, pcAddress, amount);
    // const lpAccount = get(
    //   tokenAccounts,
    //   `${farm.lp.mintAddress}.tokenAccountAddress`
    // );
    // const rewardAccount = get(
    //   tokenAccounts,
    //   `${farm.reward.mintAddress}.tokenAccountAddress`
    // );
    // // TODO:  stake account address
    // const infoAccount = "";
    // console.log(">> lpAccount : ", lpAccount);
    // console.log(">> reward account :", rewardAccount);
  };

  const updateFarm = async () => {
    // getFarmRewardAccount(connection);
    // const liquidity = await requestInfos(connection);

    const farms = await getFarmRewardAccount(connection);

    // console.log("farm ", farms);
    // const stakeAcc = await getStakeAccounts(connection, wallet, connected);

    // const price = await getPrices();

    // const result = await updateFarms(farms, stakeAcc, liquidity, price);

    // console.log(result);
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
      deposit={stakeLP.bind(
        this,
        farm.lp.coin.mintAddress,
        farm.lp.pc.mintAddress
      )}
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
      <button onClick={updateFarm}>Update Farm</button>
    </div>
  );
};

export default Farm;
