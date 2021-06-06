import {
    Connection,
    PublicKey,
    SYSVAR_CLOCK_PUBKEY,
    Transaction,
    TransactionInstruction
} from '@solana/web3.js'
// @ts-ignore
import { nu64, struct, u8, blob } from 'buffer-layout';
import { publicKey, u128, u64 } from '@project-serum/borsh';
import { WalletAdapter } from '../store/wallet';
import { createProgramAccountIfNotExist, createTokenAccountIfNotExist, sendTransaction } from './web3';
import { TokenAmount } from './safe-math';
import { SOL_HACK_PROGRAM_ID, TOKEN_PROGRAM_ID } from './ids';



export function depositInstruction(
    programId: PublicKey,
    // staking pool
    poolId: PublicKey,
    poolAuthority: PublicKey,
    // user
    userInfoAccount: PublicKey,
    userOwner: PublicKey,
    userLpTokenAccount: PublicKey,
    poolLpTokenAccount: PublicKey,
    userRewardTokenAccount: PublicKey,
    poolRewardTokenAccount: PublicKey,
    // tokenProgramId: PublicKey,
    amount: number
): TransactionInstruction {
    const dataLayout = struct([u8('instruction'), nu64('amount')])

    const keys = [
        { pubkey: poolId, isSigner: false, isWritable: true },
        { pubkey: poolAuthority, isSigner: false, isWritable: true },
        { pubkey: userInfoAccount, isSigner: false, isWritable: true },
        { pubkey: userOwner, isSigner: true, isWritable: true },
        { pubkey: userLpTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolLpTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userRewardTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolRewardTokenAccount, isSigner: false, isWritable: true },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true }
    ]

    const data = Buffer.alloc(dataLayout.span)
    dataLayout.encode(
        {
            instruction: 1,
            amount
        },
        data
    )

    return new TransactionInstruction({
        keys,
        programId,
        data
    })
}


// deposit 
export async function deposit(
    connection: Connection | undefined | null,
    wallet: WalletAdapter | undefined | null,
    farmInfo: any | undefined | null,
    lpAccount: string | undefined | null,
    rewardAccount: string | undefined | null,
    infoAccount: string | undefined | null,
    amount: string | undefined | null
): Promise<string> {
    if (!connection || !wallet) throw new Error('Miss connection');
    if (!farmInfo) throw new Error('Miss pool information');
    if (!lpAccount) throw new Error('Miss account information');
    if (!amount) throw new Error('Miss amount information');

    const transaction = new Transaction();
    const signers: any = [];

    const owner = wallet.publicKey;

    // if no account, create new one
    const userRewardTokenAccount = await createTokenAccountIfNotExist(
        connection,
        rewardAccount,
        owner,
        farmInfo.reward.mintAddress,
        null,
        transaction,
        signers
    );


    // if no userinfo account, create new one
    const programId = new PublicKey(farmInfo.programId)
    const userInfoAccount = await createProgramAccountIfNotExist(
        connection,
        infoAccount,
        owner,
        programId,
        null,
        USER_STAKE_INFO_ACCOUNT_LAYOUT,
        transaction,
        signers
    );

    const value = new TokenAmount(amount, farmInfo.lp.decimals, false).wei.toNumber();

    transaction.add(
        depositInstruction(
            programId,
            new PublicKey(farmInfo.poolId),
            new PublicKey(farmInfo.poolAuthority),
            userInfoAccount,
            wallet.publicKey,
            new PublicKey(lpAccount),
            new PublicKey(farmInfo.poolLpTokenAccount),
            userRewardTokenAccount,
            new PublicKey(farmInfo.poolRewardTokenAccount),
            value
        )
    );

    return await sendTransaction(connection, wallet, transaction, signers)
}



export const USER_STAKE_INFO_ACCOUNT_LAYOUT = struct([
    u64('state'),
    publicKey('poolId'),
    publicKey('stakerOwner'),
    u64('depositBalance'),
    u64('rewardDebt')
])

export const USER_STAKE_INFO_ACCOUNT_LAYOUT_V4 = struct([
    u64('state'),
    publicKey('poolId'),
    publicKey('stakerOwner'),
    u64('depositBalance'),
    u64('rewardDebt'),
    u64('rewardDebtB')
])


export async function depositV4(
    connection: Connection | undefined | null,
    wallet: any | undefined | null,
    farmInfo: any | undefined | null,
    lpAccount: string | undefined | null,
    rewardAccount: string | undefined | null,
    rewardAccountB: string | undefined | null,
    infoAccount: string | undefined | null,
    amount: string | undefined | null
): Promise<string> {
    if (!connection || !wallet) throw new Error('Miss connection');
    if (!farmInfo) throw new Error('Miss pool infomations');
    if (!lpAccount) throw new Error('Miss account infomations');
    if (!amount) throw new Error('Miss amount infomations');

    const transaction = new Transaction()
    const signers: any = []

    const owner = wallet.publicKey

    // if no account, create new one
    const userRewardTokenAccount = await createTokenAccountIfNotExist(
        connection,
        rewardAccount,
        owner,
        farmInfo.reward.mintAddress,
        null,
        transaction,
        signers
    );

    // if no account, create new one
    const userRewardTokenAccountB = await createTokenAccountIfNotExist(
        connection,
        rewardAccountB,
        owner,
        // @ts-ignore
        farmInfo.rewardB.mintAddress,
        null,
        transaction,
        signers
    )

    // if no userinfo account, create new one
    // const programId = new PublicKey(farmInfo.programId)
    const programId = new PublicKey(SOL_HACK_PROGRAM_ID);
    const userInfoAccount = await createProgramAccountIfNotExist(
        connection,
        infoAccount,
        owner,
        programId,
        null,
        USER_STAKE_INFO_ACCOUNT_LAYOUT_V4,
        transaction,
        signers
    )


    const value = new TokenAmount(amount, farmInfo.lp.decimals, false).wei.toNumber()



    transaction.add(
        depositInstructionV4(
            programId,
            new PublicKey(farmInfo.poolId),
            new PublicKey(farmInfo.poolAuthority),
            userInfoAccount,
            wallet.publicKey,
            new PublicKey(lpAccount),
            new PublicKey(farmInfo.poolLpTokenAccount),
            userRewardTokenAccount,
            new PublicKey(farmInfo.poolRewardTokenAccount),
            userRewardTokenAccountB,
            // @ts-ignore
            new PublicKey(farmInfo.poolRewardTokenAccountB),
            value,
            // added
            new PublicKey(farmInfo.programId)
        )
    )

    return await sendTransaction(connection, wallet, transaction, signers)
}


export function depositInstructionV4(
    programId: PublicKey,
    // staking pool
    poolId: PublicKey,
    poolAuthority: PublicKey,
    // user
    userInfoAccount: PublicKey,
    userOwner: PublicKey,
    userLpTokenAccount: PublicKey,
    poolLpTokenAccount: PublicKey,
    userRewardTokenAccount: PublicKey,
    poolRewardTokenAccount: PublicKey,
    userRewardTokenAccountB: PublicKey,
    poolRewardTokenAccountB: PublicKey,
    // tokenProgramId: PublicKey,
    amount: number,
    rayProgram: PublicKey,
): TransactionInstruction {
    const dataLayout = struct([u8('instruction'), nu64('amount')])


    const keys = [
        { pubkey: poolId, isSigner: false, isWritable: true },
        { pubkey: poolAuthority, isSigner: false, isWritable: true },
        { pubkey: userInfoAccount, isSigner: false, isWritable: true },
        { pubkey: userOwner, isSigner: true, isWritable: true },
        { pubkey: userLpTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolLpTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userRewardTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolRewardTokenAccount, isSigner: false, isWritable: true },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
        { pubkey: userRewardTokenAccountB, isSigner: false, isWritable: true },
        { pubkey: poolRewardTokenAccountB, isSigner: false, isWritable: true },
        // added 
        { pubkey: rayProgram, isSigner: false, isWritable: true }
    ]

    const data = Buffer.alloc(dataLayout.span)
    dataLayout.encode(
        {
            instruction: 1,
            amount
        },
        data
    )

    return new TransactionInstruction({
        keys,
        programId,
        data
    })
}



// withdrawV4
export async function withdrawV4(
    connection: Connection | undefined | null,
    wallet: any | undefined | null,
    farmInfo: any | undefined | null,
    lpAccount: string | undefined | null,
    rewardAccount: string | undefined | null,
    rewardAccountB: string | undefined | null,
    infoAccount: string | undefined | null,
    amount: string | undefined | null
): Promise<string> {
    if (!connection || !wallet) throw new Error('Miss connection')
    if (!farmInfo) throw new Error('Miss pool infomations')
    if (!lpAccount || !infoAccount) throw new Error('Miss account infomations')
    if (!amount) throw new Error('Miss amount infomations')

    const transaction = new Transaction()
    const signers: any = []

    const owner = wallet.publicKey

    // if no account, create new one
    const userRewardTokenAccount = await createTokenAccountIfNotExist(
        connection,
        rewardAccount,
        owner,
        farmInfo.reward.mintAddress,
        null,
        transaction,
        signers
    )

    // if no account, create new one
    const userRewardTokenAccountB = await createTokenAccountIfNotExist(
        connection,
        rewardAccountB,
        owner,
        // @ts-ignore
        farmInfo.rewardB.mintAddress,
        null,
        transaction,
        signers
    )

    const programId = new PublicKey(farmInfo.programId)
    const value = new TokenAmount(amount, farmInfo.lp.decimals, false).wei.toNumber()

    transaction.add(
        withdrawInstructionV4(
            programId,
            new PublicKey(farmInfo.poolId),
            new PublicKey(farmInfo.poolAuthority),
            new PublicKey(infoAccount),
            wallet.publicKey,
            new PublicKey(lpAccount),
            new PublicKey(farmInfo.poolLpTokenAccount),
            userRewardTokenAccount,
            new PublicKey(farmInfo.poolRewardTokenAccount),
            userRewardTokenAccountB,
            // @ts-ignore
            new PublicKey(farmInfo.poolRewardTokenAccountB),
            value
        )
    )

    return await sendTransaction(connection, wallet, transaction, signers)
}


export function withdrawInstructionV4(
    programId: PublicKey,
    // staking pool
    poolId: PublicKey,
    poolAuthority: PublicKey,
    // user
    userInfoAccount: PublicKey,
    userOwner: PublicKey,
    userLpTokenAccount: PublicKey,
    poolLpTokenAccount: PublicKey,
    userRewardTokenAccount: PublicKey,
    poolRewardTokenAccount: PublicKey,
    userRewardTokenAccountB: PublicKey,
    poolRewardTokenAccountB: PublicKey,
    // tokenProgramId: PublicKey,
    amount: number
): TransactionInstruction {
    const dataLayout = struct([u8('instruction'), nu64('amount')])

    const keys = [
        { pubkey: poolId, isSigner: false, isWritable: true },
        { pubkey: poolAuthority, isSigner: false, isWritable: true },
        { pubkey: userInfoAccount, isSigner: false, isWritable: true },
        { pubkey: userOwner, isSigner: true, isWritable: true },
        { pubkey: userLpTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolLpTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userRewardTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolRewardTokenAccount, isSigner: false, isWritable: true },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
        { pubkey: userRewardTokenAccountB, isSigner: false, isWritable: true },
        { pubkey: poolRewardTokenAccountB, isSigner: false, isWritable: true }
    ]

    const data = Buffer.alloc(dataLayout.span)
    dataLayout.encode(
        {
            instruction: 2,
            amount
        },
        data
    )

    return new TransactionInstruction({
        keys,
        programId,
        data
    })
}