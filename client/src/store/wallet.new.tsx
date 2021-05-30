import React, { useEffect, useState, useContext, useCallback } from "react";
// @ts-ignore
import Wallet from "@project-serum/sol-wallet-adapter";
import { Transaction, PublicKey } from "@solana/web3.js";
import EventEmitter from "eventemitter3";
import { useConnection, useConnectionConfig } from "./connection";
import { Provider } from "../models";

export const WalletProvider = () => {};
