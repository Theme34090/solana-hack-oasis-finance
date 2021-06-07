import React from "react";

import { useWallet } from "./wallet";
import { useConnection } from "./connection";


const AccountsContext = React.createContext<any>(null);


class AccountUpdateEvent extends Event {
    static type = "AccountUpdate";
}