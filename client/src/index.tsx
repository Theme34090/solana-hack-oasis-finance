import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { ConnectionProvider } from "./store/connection";
import { WalletProvider } from "./store/wallet";
import { BrowserRouter } from "react-router-dom";

ReactDOM.render(
  <BrowserRouter>
    <ConnectionProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </ConnectionProvider>
  </BrowserRouter>,
  document.getElementById("root")
);
