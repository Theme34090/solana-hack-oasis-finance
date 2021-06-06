import "./App.css";
import LandingView from "./container";
import { Route } from "react-router-dom";
import Header from "./components/ui/header/header";
import Liquidity from "./container/liquidity/liquidity";
import Farm from "./container/farm/farm";

// TODO: MUST BE REMOVED IN PRODUCTION
import Token from "./components/token-account/token";

function App() {
  return (
    <div>
      <Header />
      <Route path="/" exact component={LandingView} />
      <Route path="/lp" component={Liquidity} />
      <Route path="/token" component={Token} />
    </div>
  );
}

export default App;
