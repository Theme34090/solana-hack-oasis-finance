import Header from "../../components/ui/header/header";
import { useWallet } from "../../store/wallet";
import Farm from "../farm/farm";
import Liquidity from "../liquidity/liquidity";

export const LandingView = (props: {}) => {
  const { tokenAccounts } = useWallet();

  const tk = Object.keys(tokenAccounts).map((token) => (
    <div>
      <div>
        <span>TOKEN : </span> {token}
      </div>
      <div>
        <span>ACCOUNT ADDRESS : </span>{" "}
        {tokenAccounts[token].tokenAccountAddress}
      </div>
      <div>
        <span>ACCOUNT BALANCE: </span> {tokenAccounts[token].balance.fixed()}
      </div>
    </div>
  ));

  return (
    // <main>
    //   <main className={classes.MainContent}>
    //     {/* <Pool /> */}
    //     <Liquidity />
    //     <hr />
    //     <Swap />
    //     <hr />
    //     <Farm tokenAccounts={tokenAccounts} />
    //     <hr />
    //   </main>
    // </main>
    <main>
      <Header />
      <Liquidity />
      <hr />
      {tk}
      <Farm />
    </main>
  );
};
