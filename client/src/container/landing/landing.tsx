import classes from "./landing.module.css";

import Header from "../../components/ui/header/header";
import Pool from "../../components/pool/pool";
import Liquidity from "../liquidity/liquidity";
import Swap from "../swap/swap";

export const LandingView = (props: {}) => {
  // const TopBar = (
  //   <div>
  //     {!connected && (
  //       <button onClick={connected ? wallet.disconnect : wallet.connect}>
  //         Connect
  //       </button>
  //     )}
  //   </div>
  // );

  return (
    <>
      <Header />
      <main className={classes.MainContent}>
        {/* <Pool /> */}
        <Liquidity />
        <hr />
        <Swap />
      </main>
    </>
  );
};
