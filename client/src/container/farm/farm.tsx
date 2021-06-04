import { useEffect, useState } from "react";
import { cloneDeep, get } from "lodash-es";

import classes from "./farm.module.css";
import { useConnection } from "../../store/connection";
import { useWallet } from "../../store/wallet";
import { FarmInfo, FARMS, getFarmByPoolId } from "../../utils/farms";
import { TokenInfo } from "../../utils/tokens";

import { PoolItem, PoolHeader } from "../../components/pool/pool";
import Switch from "../../components/ui/switch/switch";
import { TokenAmount } from "../../utils/safe-math";

interface FarmProps {}

// const DEFAULT_FARM = cloneDeep(FARMS[0])
// const DEFAULT_LP = cloneDeep(FARMS[0].lp)
const Farm: React.FC<FarmProps> = () => {
  const connection = useConnection();
  const { wallet, tokenAccounts, connected } = useWallet();

  console.log(tokenAccounts);

  // TODO: replace dummy farm (RAY-WUSDT)
  const [currentFarm, setCurrentFarm] = useState<FarmInfo | null>(null);
  const [lp, setLp] = useState<TokenInfo | null>(null);
  const [isStakedMode, setIsStakedMode] = useState<boolean>(false);

  const toggleStakedModeHandler = () => {
    setIsStakedMode((prevState) => !prevState);
  };

  const updateCurrentFarm = (poolId: string) => {
    const farm = getFarmByPoolId(poolId);
    if (farm) {
      setCurrentFarm(farm);
      setLp(farm.lp);
    }
  };

  console.log(
    get(
      tokenAccounts,
      `14Wp3dxYTQpRMMz3AW7f2XGBTdaBrf1qb2NKjAN3Tb13.balance`
    ).wei.toNumber()
  );
  const getBalance = (mintAddress: string) => {
    // return connected ? get(tokenAccounts, `${mintAddress}.balance`) : 1.0;
    const balance = get(tokenAccounts, `${mintAddress}.balance`) as TokenAmount;
    return balance ? balance.fixed() : "1.000000";
  };

  const updateCurrentLp = (tokenAccounts: any) => {
    if (lp) {
      const coin = cloneDeep(lp);
      const lpBalance = get(tokenAccounts, `${lp.mintAddress}.balance`);
      coin.balance = lpBalance;

      setLp(coin);
    }
  };

  // // stake lp
  // const stake = () => {
  //   const lpAccount = get(
  //     tokenAccounts,
  //     `${farm.lp.mintAddress}.tokenAccountAddress`
  //   );
  //   const rewardAccount = get(
  //     tokenAccounts,
  //     `${farm.reward.mintAddress}.tokenAccountAddress`
  //   );
  //   // TODO:  stake account address
  //   const infoAccount = "";
  //   console.log(">> lpAccount : ", lpAccount);
  //   console.log(">> reward account :", rewardAccount);
  // };

  let pool: JSX.Element[] = [];

  if (isStakedMode) {
    // TODO: ...
  } else {
    pool = FARMS.map((farm) => (
      <PoolItem
        symbol={farm.name}
        mintA={farm.lp.coin.mintAddress}
        mintB={farm.lp.pc.mintAddress}
        walletBalance={getBalance(farm.lp.mintAddress)}
      />
    ));
  }

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
    </div>
  );
};

export default Farm;
