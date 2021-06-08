import { Route, Switch, Redirect } from "react-router-dom";
import Header from "./components/ui/header/header";
import Liquidity from "./container/liquidity/liquidity";
import Farm from "./container/farm/farm";

import Notification from "./components/ui/notification/notification";

// TODO: MUST BE REMOVED IN PRODUCTION
import Token from "./components/token-account/token";

function App() {
  return (
    <div>
      <Header />
      <Switch>
        <Route path="/" exact component={Farm} />
        <Redirect to="/" />
      </Switch>
      {/* <Route path="/lp" component={Liquidity} />
      <Route path="/token" component={Token} /> */}
      <Notification />
    </div>
  );
}

export default App;
