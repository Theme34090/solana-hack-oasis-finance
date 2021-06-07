import React, { useEffect, useState, useContext, useCallback } from "react";
// @ts-ignore
import Wallet from "@project-serum/sol-wallet-adapter";
import { Transaction, PublicKey } from "@solana/web3.js";
import EventEmitter from "eventemitter3";
import { useConnection, useConnectionConfig } from "./connection";
import { Provider } from "../models";
import { getTokenAccounts, TokenAccounts } from "../utils/wallet";
import {
  notifyError,
  notifyInfo,
} from "../components/ui/notification/notification";

export interface WalletAdapter extends EventEmitter {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  connect: () => any;
  disconnect: () => any;
}

export const WALLET_PROVIDERS: Provider[] = [
  new Provider("sollet", "https://www.sollet.io"),
  new Provider("solflare", "https://solflare.com/access-wallet"),
  new Provider("mathwallet.org", "https://www.mathwallet.org"),
];

export const DEFAULT_PROVIDER = WALLET_PROVIDERS[0];

const WalletContext = React.createContext<any>(null);

export const WalletProvider = ({ children = null as any }) => {
  const connection = useConnection();
  const { endpoint } = useConnectionConfig();
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccounts>({});
  const [isWalletSelected, setIsWalletSelected] = useState(false);

  const [providerUrl, setProviderUrl] = useState<string>(DEFAULT_PROVIDER.url);
  const [displayKey, setDisplayKey] = useState<string>("");

  const [wallet, setWallet] = useState<WalletAdapter>(
    new Wallet(providerUrl, endpoint)
    // new Wallet((window as any).sollet || providerUrl, endpoint)
  );

  const [connected, setConnected] = useState(false);

  // const wallet: WalletAdapter = useMemo(() => new Wallet(providerUrl, endpoint),[
  //     providerUrl,
  //     endpoint,
  // ]);
  const getDisplayWallet = (wallet: WalletAdapter) => {
    let walletPublicKey = wallet.publicKey.toBase58();
    let keyToDisplay =
      walletPublicKey.length > 20
        ? `${walletPublicKey.substring(0, 7)}.....${walletPublicKey.substring(
            walletPublicKey.length - 7,
            walletPublicKey.length
          )}`
        : walletPublicKey;
    return keyToDisplay;
  };

  const updateTokenAccount = async () => {
    try {
      const tokenAcc = await getTokenAccounts(connection, wallet);
      setTokenAccounts(tokenAcc);
    } catch (err) {
      console.error(err);
    }
  };

  const connectWallet = useCallback(
    async (providerURL: string) => {
      const newWallet = new Wallet(providerURL, endpoint);
      // const wall = new Wallet((window as any).sollet || providerUrl, endpoint);

      setProviderUrl(providerURL);
      setWallet(newWallet);
      setIsWalletSelected(true);
    },
    [endpoint, providerUrl]
  );

  // useEffect(() => {
  //   setWallet(new Wallet(providerUrl, endpoint));
  // }, [providerUrl, endpoint]);

  useEffect(() => {
    console.log("trying to connect");
    if (!connected && isWalletSelected) {
      try {
        wallet.connect();
      } catch (error) {
        console.log(error);
      }
    }

    wallet.on("connect", async () => {
      setConnected(true);
      let walletPublicKey = wallet.publicKey.toBase58();
      let keyToDisplay =
        walletPublicKey.length > 20
          ? `${walletPublicKey.substring(0, 7)}.....${walletPublicKey.substring(
              walletPublicKey.length - 7,
              walletPublicKey.length
            )}`
          : walletPublicKey;
      setDisplayKey(keyToDisplay);
      await updateTokenAccount();
      // notification
      notifyInfo(`Connect to wallet ${keyToDisplay}`);
    });

    wallet.on("disconnect", () => {
      setConnected(false);
      setDisplayKey("");
      setTokenAccounts({});
      setIsWalletSelected(false);
      notifyInfo("Disconnected from wallet");
    });
  }, [wallet]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connected,
        providerUrl,
        tokenAccounts,
        setProviderUrl,
        connectWallet,
        displayKey,
        providerName:
          WALLET_PROVIDERS.find(({ url }) => url === providerUrl)?.name ??
          providerUrl,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet() {
  const context = useContext(WalletContext);
  return {
    connected: context.connected,
    wallet: context.wallet,
    providerUrl: context.providerUrl,
    connectWallet: context.connectWallet,
    tokenAccounts: context.tokenAccounts,
    displayKey: context.displayKey,
    setProvider: context.setProviderUrl,
    providerName: context.providerName,
  };
}
