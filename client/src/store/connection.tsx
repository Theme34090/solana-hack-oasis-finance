import { Account, clusterApiUrl, Connection } from "@solana/web3.js";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { setProgramIds } from "../utils/ids";

export type ENV = "mainnet-beta" | "testnet" | "devnet" | "localnet";

export const ENDPOINTS = [
  {
    name: "mainnet-beta" as ENV,
    endpoint: "https://solana-api.projectserum.com/",
  },
  { name: "testnet" as ENV, endpoint: clusterApiUrl("testnet") },
  { name: "devnet" as ENV, endpoint: clusterApiUrl("devnet") },
  { name: "localnet" as ENV, endpoint: "http://127.0.0.1:8899" },
];

// const DEFAULT = ENDPOINTS[0].endpoint;
const DEFAULT = ENDPOINTS[2].endpoint; // devnet

const DEFAULT_SLIPPAGE = 0.25;

interface ConnectionConfig {
  connection: Connection;
  sendConnection: Connection;
  endpoint: string;
  slippage: number;
  setSlippage: (val: number) => void;
  env: ENV;
  setEndpoint: (val: string) => void;
}

const ConnectionContext = React.createContext<ConnectionConfig>({
  endpoint: DEFAULT,
  setEndpoint: () => {},
  slippage: DEFAULT_SLIPPAGE,
  setSlippage: (val: number) => {},
  connection: new Connection(DEFAULT, "recent"),
  sendConnection: new Connection(DEFAULT, "recent"),
  env: ENDPOINTS[0].name,
});

export function ConnectionProvider({ children = undefined as any }) {
  // TODO: custom endpoint
  const [endpoint, setEndpoint] = useState<string>(DEFAULT);

  // TODO: custom slippage
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE);

  const connection = useMemo(
    () => new Connection(endpoint, "recent"),
    [endpoint]
  );
  const sendConnection = useMemo(
    () => new Connection(endpoint, "recent"),
    [endpoint]
  );

  const env =
    ENDPOINTS.find((end) => end.endpoint === endpoint)?.name ||
    ENDPOINTS[0].name;

  setProgramIds(env);

  useEffect(() => {
    const id = connection.onAccountChange(new Account().publicKey, () => {});

    return () => {
      connection.removeAccountChangeListener(id);
    };
  }, [connection]);

  useEffect(() => {
    const id = connection.onSlotChange(() => null);

    return () => {
      connection.removeSlotChangeListener(id);
    };
  }, [connection]);

  useEffect(() => {
    const id = sendConnection.onAccountChange(
      new Account().publicKey,
      () => {}
    );
    return () => {
      sendConnection.removeAccountChangeListener(id);
    };
  }, [sendConnection]);

  useEffect(() => {
    const id = sendConnection.onSlotChange(() => null);

    return () => {
      sendConnection.removeSlotChangeListener(id);
    };
  }, [sendConnection]);

  return (
    <ConnectionContext.Provider
      value={{
        endpoint,
        setEndpoint,
        slippage: slippage,
        setSlippage: (val: number) => setSlippage(val),
        connection,
        sendConnection,
        env,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext).connection as Connection;
}

export function useSendConnection() {
  return useContext(ConnectionContext)?.sendConnection;
}

export function useConnectionConfig() {
  const context = useContext(ConnectionContext);
  return {
    endpoint: context.endpoint,
    setEndpoint: context.setEndpoint,
    env: context.env,
  };
}

export function useSlippageConfig() {
  const { slippage, setSlippage } = useContext(ConnectionContext);
  return { slippage, setSlippage };
}
