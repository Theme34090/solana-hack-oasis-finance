import { useState } from "react";
// import { useConnectionConfig } from "../../store/connection";
// import { getTokenSymbol } from "../../utils/utils";

import PoolIcon from "./pool-icon/pool-icon";
import Exchange from "./exchange/exchange";

import classes from "./pool.module.css";

type PoolItemProps = {
  symbol: string;
  mintA: string;
  mintB: string;
  walletBalance: string;
  deposit: (amount: string) => any;
};

export const PoolItem: React.FC<PoolItemProps> = ({
  walletBalance,
  symbol,
  mintA,
  mintB,
  deposit,
}) => {
  const [selected, setSelected] = useState(false);

  const toggleDropdownHandler = () => {
    setSelected((prevState) => !prevState);
  };

  return (
    <div className={selected ? classes.Selected : ""}>
      <div className={classes.TableRow}>
        <div className={classes.TableRowAsset}>
          <div className={classes.PoolItem}>
            <PoolIcon mintA={mintA} mintB={mintB} />
            <h4>
              {symbol}
              <p>TVL :</p>
            </h4>
          </div>
        </div>
        <div className={classes.TableRolCell}>{walletBalance}</div>
        <div className={classes.TableRolCell}>0.000000</div>
        <div className={classes.TableRolCell}>0.10%</div>
        <div className={classes.TableRolCell}>0.68%</div>
        <div className={classes.TableRolCell}>42.19%</div>
        <div className={classes.TableRolCell} onClick={toggleDropdownHandler}>
          <i className={classes.ArrowDown}></i>
        </div>
      </div>
      <Exchange
        symbol={symbol}
        maxLp={walletBalance}
        deposit={deposit}
        show={selected}
      />
    </div>
  );
};

export const PoolHeader: React.FC = () => {
  return (
    <div className={`${classes.TableRow} ${classes.TableRowHeader}`}>
      <div className={classes.TableRowAsset}>Asset</div>
      <div className={classes.TableRolCell}>Wallet Balance</div>
      <div className={classes.TableRolCell}>Deposited</div>
      <div className={classes.TableRolCell}>Daily APR</div>
      <div className={classes.TableRolCell}>Weekly APY</div>
      <div className={classes.TableRolCell}>Yearly APR</div>
    </div>
  );
};

// interface PoolProps {
//   select: () => any;
// }

// const Pool: React.FC = () => {
//   const [switchView, setSwitchView] = useState<boolean>(false);

//   const switchHandler = () => {
//     setSwitchView((prevState) => !prevState);
//   };

//   // TODO: remove dummy data
//   let dummyPool: JSX.Element[] = [];

//   if (!switchView) {
//     // for (let i = 0; i < 10; i++) {
//     //   dummyPool.push(
//     //     <PoolItem
//     //       mintA="So11111111111111111111111111111111111111112"
//     //       mintB="D4fdoY5d2Bn1Cmjqy6J6shRHjcs7QNuBPzwEzTLrf7jm"
//     //     />
//     //   );
//     // }
//     dummyPool = FARMS.map((farm) => {
//       console.log(farm.lp.coin.mintAddress, farm.lp.pc.mintAddress);
//       return (
//         <PoolItem
//           symbol={farm.name}
//           mintA={farm.lp.coin.mintAddress}
//           mintB={farm.lp.pc.mintAddress}
//         />
//       );
//     });
//   } else {
//     for (let i = 0; i < 5; i++) {
//       dummyPool.push(
//         <PoolItem
//           symbol="RAY-SOL"
//           mintA="So11111111111111111111111111111111111111112"
//           mintB="D4fdoY5d2Bn1Cmjqy6J6shRHjcs7QNuBPzwEzTLrf7jm"
//         />
//       );
//     }
//   }

//   return (
//     <div className={classes.Pool}>
//       <div className={classes.SwitchWrapper}>
//         <Switch clicked={switchHandler} />
//         <span className={classes.Text}>Show Staked</span>
//       </div>
//       <div className={classes.Table}>
//         <PoolHeader />
//         {dummyPool}
//       </div>
//     </div>
//   );
// };

// export default Pool;
