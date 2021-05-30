import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'
import { WalletAdapter } from "../store/wallet";
import { LiquidityPoolInfo } from "./pools";
import { TokenAmount } from './safe-math';
import { NATIVE_SOL, TokenInfo, TOKENS } from "./tokens";
// @ts-ignore
import { closeAccount } from '@project-serum/serum/lib/token-instructions'
import { createTokenAccountIfNotExist, sendTransaction } from './web3';
// @ts-ignore
import { nu64, struct, u8 } from 'buffer-layout'

export const addLiquidity = async (
    connection: Connection | undefined | null,
    wallet: any | undefined | null,
    poolInfo: LiquidityPoolInfo | undefined | null,
    fromCoinAccount: string | undefined | null,
    toCoinAccount: string | undefined | null,
    lpAccount: string | undefined | null,
    fromCoin: TokenInfo | undefined | null,
    toCoin: TokenInfo | undefined | null,
    fromAmount: string | undefined | null,
    toAmount: string | undefined | null,
    fixedCoin: string
) => {
    if (!connection || !wallet) throw new Error('Miss connection')
    if (!poolInfo || !fromCoin || !toCoin) {
        throw new Error('Miss pool information')
    }
    if (!fromCoinAccount || !toCoinAccount) {
        throw new Error('Miss account information')
    }
    if (!fromAmount || !toAmount) {
        throw new Error('Miss amount information')
    }

    const transaction = new Transaction()
    const signers: any = []

    const owner = wallet.publicKey;

    const userAccounts = [new PublicKey(fromCoinAccount), new PublicKey(toCoinAccount)];
    const userAmounts = [fromAmount, toAmount];

    if (poolInfo.coin.mintAddress === toCoin.mintAddress && poolInfo.pc.mintAddress === fromCoin.mintAddress) {
        userAccounts.reverse()
        userAmounts.reverse()
    }

    const userCoinTokenAccount = userAccounts[0];
    const userPcTokenAccount = userAccounts[1];
    const coinAmount = new TokenAmount(userAmounts[0], poolInfo.coin.decimals, false).wei.toNumber();
    const pcAmount = new TokenAmount(userAmounts[1], poolInfo.pc.decimals, false).wei.toNumber();

    let wrappedCoinSolAccount
    if (poolInfo.coin.mintAddress === NATIVE_SOL.mintAddress) {
        wrappedCoinSolAccount = await createTokenAccountIfNotExist(
            connection,
            wrappedCoinSolAccount,
            owner,
            TOKENS.WSOL.mintAddress,
            coinAmount + 1e7,
            transaction,
            signers
        )
    }

    let wrappedSolAccount
    if (poolInfo.pc.mintAddress === NATIVE_SOL.mintAddress) {
        wrappedSolAccount = await createTokenAccountIfNotExist(
            connection,
            wrappedSolAccount,
            owner,
            TOKENS.WSOL.mintAddress,
            pcAmount + 1e7,
            transaction,
            signers
        )
    }

    let userLpTokenAccount = await createTokenAccountIfNotExist(
        connection,
        lpAccount,
        owner,
        poolInfo.lp.mintAddress,
        null,
        transaction,
        signers
    )

    transaction.add(
        addLiquidityInstructionV4(
            new PublicKey(poolInfo.programId),

            new PublicKey(poolInfo.ammId),
            new PublicKey(poolInfo.ammAuthority),
            new PublicKey(poolInfo.ammOpenOrders),
            new PublicKey(poolInfo.ammTargetOrders),
            new PublicKey(poolInfo.lp.mintAddress),
            new PublicKey(poolInfo.poolCoinTokenAccount),
            new PublicKey(poolInfo.poolPcTokenAccount),

            new PublicKey(poolInfo.serumMarket),

            wrappedCoinSolAccount ? wrappedCoinSolAccount : userCoinTokenAccount,
            wrappedSolAccount ? wrappedSolAccount : userPcTokenAccount,
            userLpTokenAccount,
            owner,

            coinAmount,
            pcAmount,
            fixedCoin === poolInfo.coin.mintAddress ? 0 : 1
        ))

    if (wrappedCoinSolAccount) {
        transaction.add(
            closeAccount({
                source: wrappedCoinSolAccount,
                destination: owner,
                owner: owner
            })
        )
    }
    if (wrappedSolAccount) {
        transaction.add(
            closeAccount({
                source: wrappedSolAccount,
                destination: owner,
                owner: owner
            })
        )
    }

    return await sendTransaction(connection, wallet, transaction, signers)
}

export function addLiquidityInstruction(
    programId: PublicKey,
    // tokenProgramId: PublicKey,
    // amm
    ammId: PublicKey,
    ammAuthority: PublicKey,
    ammOpenOrders: PublicKey,
    ammQuantities: PublicKey,
    lpMintAddress: PublicKey,
    poolCoinTokenAccount: PublicKey,
    poolPcTokenAccount: PublicKey,
    // serum
    serumMarket: PublicKey,
    // user
    userCoinTokenAccount: PublicKey,
    userPcTokenAccount: PublicKey,
    userLpTokenAccount: PublicKey,
    userOwner: PublicKey,

    maxCoinAmount: number,
    maxPcAmount: number,
    fixedFromCoin: number
): TransactionInstruction {
    const dataLayout = struct([u8('instruction'), nu64('maxCoinAmount'), nu64('maxPcAmount'), nu64('fixedFromCoin')])

    const keys = [
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
        { pubkey: ammId, isSigner: false, isWritable: true },
        { pubkey: ammAuthority, isSigner: false, isWritable: true },
        { pubkey: ammOpenOrders, isSigner: false, isWritable: true },
        // { pubkey: ammQuantities, isSigner: false, isWritable: true },
        { pubkey: lpMintAddress, isSigner: false, isWritable: true },
        { pubkey: poolCoinTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolPcTokenAccount, isSigner: false, isWritable: true },
        { pubkey: serumMarket, isSigner: false, isWritable: true },
        { pubkey: userCoinTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userPcTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userLpTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userOwner, isSigner: true, isWritable: true }
    ]

    const data = Buffer.alloc(dataLayout.span)
    dataLayout.encode(
        {
            instruction: 3,
            maxCoinAmount,
            maxPcAmount,
            fixedFromCoin
        },
        data
    )

    return new TransactionInstruction({
        keys,
        programId,
        data
    })
}


export function addLiquidityInstructionV4(
    programId: PublicKey,
    // tokenProgramId: PublicKey,
    // amm
    ammId: PublicKey,
    ammAuthority: PublicKey,
    ammOpenOrders: PublicKey,
    ammTargetOrders: PublicKey,
    lpMintAddress: PublicKey,
    poolCoinTokenAccount: PublicKey,
    poolPcTokenAccount: PublicKey,
    // serum
    serumMarket: PublicKey,
    // user
    userCoinTokenAccount: PublicKey,
    userPcTokenAccount: PublicKey,
    userLpTokenAccount: PublicKey,
    userOwner: PublicKey,

    maxCoinAmount: number,
    maxPcAmount: number,
    fixedFromCoin: number
): TransactionInstruction {
    const dataLayout = struct([u8('instruction'), nu64('maxCoinAmount'), nu64('maxPcAmount'), nu64('fixedFromCoin')])

    const keys = [
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
        { pubkey: ammId, isSigner: false, isWritable: true },
        { pubkey: ammAuthority, isSigner: false, isWritable: true },
        { pubkey: ammOpenOrders, isSigner: false, isWritable: true },
        { pubkey: ammTargetOrders, isSigner: false, isWritable: true },
        { pubkey: lpMintAddress, isSigner: false, isWritable: true },
        { pubkey: poolCoinTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolPcTokenAccount, isSigner: false, isWritable: true },
        { pubkey: serumMarket, isSigner: false, isWritable: true },
        { pubkey: userCoinTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userPcTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userLpTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userOwner, isSigner: true, isWritable: true }
    ]

    const data = Buffer.alloc(dataLayout.span)
    dataLayout.encode(
        {
            instruction: 3,
            maxCoinAmount,
            maxPcAmount,
            fixedFromCoin
        },
        data
    )

    return new TransactionInstruction({
        keys,
        programId,
        data
    })
}