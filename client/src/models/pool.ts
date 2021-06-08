import { PublicKey } from "@solana/web3.js";

export interface PoolInfo {
  pubkeys: {
    program: PublicKey;
    account: PublicKey;
    holdingAccounts: PublicKey[];
    holdingMints: PublicKey[];
    mint: PublicKey;
    feeAccount?: PublicKey;
  };
  legacy: boolean;
  raw: any;
}
