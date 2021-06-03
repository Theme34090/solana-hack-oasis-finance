import { useEffect, useState } from "react";
import { get } from "lodash-es";
import { loadPoolInfo } from "@project-serum/pool";

import { useConnection } from "../../store/connection";
import { useWallet } from "../../store/wallet";
import { FarmInfo, FARMS } from "../../utils/farms";
import { PublicKey } from "@solana/web3.js";

interface FarmProps {
  tokenAccounts: any;
}

const Farm: React.FC<FarmProps> = ({ tokenAccounts }) => {
  const connection = useConnection();
  const { wallet } = useWallet();

  // TODO: replace dummy farm (RAY-WUSDT)
  const [farm, setFarm] = useState<FarmInfo>(FARMS[0]);

  //   useEffect(() => {
  //     const poolAddress = new PublicKey(
  //       "9rpQHSyFVM1dkkHFQ2TtTzPEW7DVmEyPmN8wVniqJtuC"
  //     );

  //     loadPoolInfo(connection, poolAddress).then((poolInfo) => {
  //       console.log(poolInfo.state);
  //     });
  //   }, []);

  // update current farm
  const updateFarm = () => {};

  // update current lp
  const updateCurrentLp = () => {};

  // stake lp
  const stake = () => {
    const lpAccount = get(
      tokenAccounts,
      `${farm.lp.mintAddress}.tokenAccountAddress`
    );
    const rewardAccount = get(
      tokenAccounts,
      `${farm.reward.mintAddress}.tokenAccountAddress`
    );
    // TODO:  stake account address
    const infoAccount = "";
    console.log(">> lpAccount : ", lpAccount);
    console.log(">> reward account :", rewardAccount);
  };

  return (
    <div>
      <button onClick={stake}>Stake</button>
    </div>
  );
};

export default Farm;
