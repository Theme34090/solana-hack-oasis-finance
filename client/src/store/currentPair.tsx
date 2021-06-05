import React, { useContext, useState } from "react";
import { TokenAccount } from "../models/account";
import { useConnection } from "./connection";

export interface CurrencyContextState {
  mintAddress: string;
  account?: TokenAccount;
  amount: string;
  setAmount: (val: string) => void;
  setMint: (mintAddress: string) => void;
  convertAmount: () => number;
  sufficientBalance: () => boolean;
}

export interface CurrencyPairContextState {
  mintAddressA: string;
  mintAddressB: string;
  depositAmount: number;
  withdrawnAmount: number;
  setCurrentPair: (mintAddressA: string, mintAddressB: string) => void;
}

const CurrencyPairContext =
  React.createContext<CurrencyPairContextState | null>(null);

const CurrencyPairProvider: React.FC = ({ children }) => {
  const connection = useConnection();
  const [mintAddressA, setMintAddressA] = useState("");
  const [mintAddressB, setMintAddressB] = useState("");
  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawnAmount, setWithdrawnAmount] = useState(0);

  const setCurrentPair = (mintAddressA: string, mintAddressB: string) => {
    setMintAddressA(mintAddressA);
    setMintAddressB(mintAddressB);
  };
  return (
    <CurrencyPairContext.Provider
      value={{
        mintAddressA,
        mintAddressB,
        depositAmount,
        withdrawnAmount,
        setCurrentPair,
      }}
    >
      {children}
    </CurrencyPairContext.Provider>
  );
};
