import {
    Account,
    Connection,
    PublicKey,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY,
    Transaction,
    TransactionInstruction
} from '@solana/web3.js'
// @ts-ignore
import { nu64, struct, u8 } from 'buffer-layout';
import { publicKey, u64 } from '@project-serum/borsh';
import { createProgramAccountIfNotExist, createTokenAccountIfNotExist, sendTransaction } from './web3';
import { TokenAmount } from './safe-math';
import { SOL_HACK_PROGRAM_ID, TOKEN_PROGRAM_ID } from './ids';
import { ACCOUNT_LAYOUT, USER_STAKE_INFO_ACCOUNT_LAYOUT, USER_STAKE_INFO_ACCOUNT_LAYOUT_V4 } from './layouts';




// TEST
export async function deposit(
    connection: Connection | undefined | null,
    wallet: any | undefined | null,
    farmInfo: any | undefined | null,
    lpAccount: string | undefined | null,
    rewardAccount: string | undefined | null,
    rewardAccountB: string | undefined | null,
    infoAccount: string | undefined | null,
    amount: string | undefined | null
) {
    if (!connection || !wallet) throw new Error('Miss connection');
    if (!farmInfo) throw new Error('Miss pool infomations');
    if (!lpAccount) throw new Error('Miss account infomations');
    if (!amount) throw new Error('Miss amount infomations');

    const transaction = new Transaction()
    const signers: any = []


    const programId = new PublicKey(SOL_HACK_PROGRAM_ID);
    const cpiProgramId = new PublicKey(farmInfo.programId)

    const owner = wallet.publicKey;
    const poolId = new PublicKey(farmInfo.poolId);
    const poolAuthority = new PublicKey(farmInfo.poolAuthority);
    const userInfoAccount = await createProgramAccountIfNotExist(
        connection,
        infoAccount,
        owner,
        cpiProgramId,
        null,
        USER_STAKE_INFO_ACCOUNT_LAYOUT_V4,
        transaction,
        signers
    )


    // create temp user info account where owner is raydium program
    const tempUserInfoAccount = new Account()
    transaction.add(
        SystemProgram.createAccount({
            programId: programId,
            space: USER_STAKE_INFO_ACCOUNT_LAYOUT_V4.span,
            lamports: await connection.getMinimumBalanceForRentExemption(USER_STAKE_INFO_ACCOUNT_LAYOUT_V4.span, 'singleGossip'),
            fromPubkey: owner,
            newAccountPubkey: tempUserInfoAccount.publicKey,
        })
    )
    const userLpTokenAccount = new PublicKey(lpAccount);
    const tempUserLoTokenAccount = new Account();
    transaction.add(
        SystemProgram.createAccount({
            programId: programId,
            space: ACCOUNT_LAYOUT.span,
            lamports: await connection.getMinimumBalanceForRentExemption(ACCOUNT_LAYOUT.span, 'singleGossip'),
            fromPubkey: owner,
            newAccountPubkey: tempUserLoTokenAccount.publicKey,
        })
    );


    const poolLpTokenAccount = new PublicKey(farmInfo.poolLpTokenAccount);

    const userRewardTokenAccount = await createTokenAccountIfNotExist(
        connection,
        rewardAccount,
        owner,
        farmInfo.reward.mintAddress,
        null,
        transaction,
        signers
    );
    const tempRewardTokenAccount = new Account()
    transaction.add(
        SystemProgram.createAccount({
            programId: programId,
            space: ACCOUNT_LAYOUT.span,
            lamports: await connection.getMinimumBalanceForRentExemption(ACCOUNT_LAYOUT.span, 'singleGossip'),
            fromPubkey: owner,
            newAccountPubkey: tempRewardTokenAccount.publicKey,
        })
    );

    const poolRewardTokenAccount = new PublicKey(farmInfo.poolRewardTokenAccount)
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
    const tempUserRewardTokenAccountB = new Account();
    transaction.add(
        SystemProgram.createAccount({
            programId: programId,
            space: ACCOUNT_LAYOUT.span,
            lamports: await connection.getMinimumBalanceForRentExemption(ACCOUNT_LAYOUT.span, 'singleGossip'),
            fromPubkey: owner,
            newAccountPubkey: tempUserRewardTokenAccountB.publicKey,
        })
    );

    const poolRewardTokenAccountB = new PublicKey(farmInfo.poolRewardTokenAccountB)

    //   const keys = [
    //     { pubkey: poolId, isSigner: false, isWritable: true },
    //     { pubkey: poolAuthority, isSigner: false, isWritable: true },
    //     { pubkey: userInfoAccount, isSigner: false, isWritable: true },
    //     { pubkey: userOwner, isSigner: true, isWritable: true },
    //     { pubkey: userLpTokenAccount, isSigner: false, isWritable: true },
    //     { pubkey: poolLpTokenAccount, isSigner: false, isWritable: true },
    //     { pubkey: userRewardTokenAccount, isSigner: false, isWritable: true },
    //     { pubkey: poolRewardTokenAccount, isSigner: false, isWritable: true },
    //     { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: true },
    //     { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
    //     { pubkey: userRewardTokenAccountB, isSigner: false, isWritable: true },
    //     { pubkey: poolRewardTokenAccountB, isSigner: false, isWritable: true },
    //     // added 
    //     { pubkey: rayProgram, isSigner: false, isWritable: true }
    // ]

}



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



// TEST
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
            instruction: 4,
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

    // const programId = new PublicKey(farmInfo.programId)
    const programId = new PublicKey(SOL_HACK_PROGRAM_ID);
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
            value,
            // added 
            new PublicKey(farmInfo.programId),
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
        { pubkey: rayProgram, isSigner: false, isWritable: true }
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

