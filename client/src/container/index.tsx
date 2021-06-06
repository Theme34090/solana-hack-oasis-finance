import { useWallet } from "../store/wallet";
import Farm from "./farm/farm";

import Notification from "../components/ui/notification/notification";
import "react-toastify/dist/ReactToastify.css";

const LandingView = (props: {}) => {
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
      {/* <Liquidity /> */}
      {/* <button onClick={notify}>Notify!</button> */}
      {/* {tk} */}
      <Farm />
      <Notification />
    </main>
  );
};

export default LandingView;
