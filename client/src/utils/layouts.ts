import { bool, publicKey, struct, u32, u64, u8 } from '@project-serum/borsh'
// @ts-ignore
import * as BufferLayout from "buffer-layout";

// // https://github.com/solana-labs/solana-program-library/blob/master/token/js/client/token.js#L210
export const ACCOUNT_LAYOUT = struct([
    publicKey('mint'),
    publicKey('owner'),
    u64('amount'),
    u32('delegateOption'),
    publicKey('delegate'),
    u8('state'),
    u32('isNativeOption'),
    u64('isNative'),
    u64('delegatedAmount'),
    u32('closeAuthorityOption'),
    publicKey('closeAuthority')
])

export const MINT_LAYOUT = struct([
    u32('mintAuthorityOption'),
    publicKey('mintAuthority'),
    u64('supply'),
    u8('decimals'),
    bool('initialized'),
    u32('freezeAuthorityOption'),
    publicKey('freezeAuthority')
])

export const RAYDIUM_ACCOUNT_LAYOUT = struct([
    BufferLayout.u8("isInitialized"),
    publicKey('userInfoAccount'),
    publicKey('userLpTokenAccount'),
    publicKey('userRewardTokenAccount'),
    publicKey('userRewardTokenAccountB'),
])

export const USER_STAKE_INFO_ACCOUNT_LAYOUT = BufferLayout.struct([
    u64('state'),
    publicKey('poolId'),
    publicKey('stakerOwner'),
    u64('depositBalance'),
    u64('rewardDebt')
])

export const USER_STAKE_INFO_ACCOUNT_LAYOUT_V4 = BufferLayout.struct([
    u64('state'),
    publicKey('poolId'),
    publicKey('stakerOwner'),
    u64('depositBalance'),
    u64('rewardDebt'),
    u64('rewardDebtB')
])