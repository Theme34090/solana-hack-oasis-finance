import { useState } from "react";

import PoolIcon from "./pool-icon/pool-icon";
import Exchange from "./exchange/exchange";

import classes from "./pool.module.css";

type PoolItemProps = {
  symbol: string;
  mintA: string;
  mintB: string;
  walletBalance: string;
  depositBalance: string;
  deposit: (amount: string) => any;
  withdraw: (amount: string) => any;
};

export const PoolItem: React.FC<PoolItemProps> = ({
  walletBalance,
  depositBalance,
  symbol,
  mintA,
  mintB,
  deposit,
  withdraw,
}) => {
  const [selected, setSelected] = useState(false);

  const toggleDropdownHandler = () => {
    setSelected((prevState) => !prevState);
  };

  return (
    <div className={selected ? classes.Selected : ""}>
      <div className={classes.TableRow}>
        <div className={`${classes.TableRowAsset} ${classes.TableRowCell} `}>
          <div className={classes.PoolItem}>
            <PoolIcon mintA={mintA} mintB={mintB} />
            <h4>
              {symbol}
              <p>TVL :</p>
            </h4>
          </div>
        </div>
        <div className={classes.TableRowCell}>{walletBalance}</div>
        <div className={classes.TableRowCell}>{depositBalance}</div>
        <div className={classes.TableRowCell}>0.10%</div>
        <div className={classes.TableRowCell}>0.68%</div>
        <div className={classes.TableRowCell}>42.19%</div>
        <div className={classes.TableRowCell} onClick={toggleDropdownHandler}>
          <i className={classes.ArrowDown}></i>
        </div>
      </div>
      <Exchange
        symbol={symbol}
        maxLp={walletBalance}
        maxDeposit={depositBalance}
        deposit={deposit}
        withdraw={withdraw}
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
