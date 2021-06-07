import * as anchor from "@project-serum/anchor";
import * as spl from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// @ts-ignore
import { struct } from "buffer-layout";
import { publicKey, u64 } from "@project-serum/borsh";
import { commitment } from "./web3";
import { FarmInfo } from "./farms";
import { Connection } from "@solana/web3.js";

import { initializeAccount } from '@project-serum/serum/lib/token-instructions'
import { ACCOUNT_LAYOUT } from "./layouts";
import { TokenAmount } from "./safe-math";
import idl from "./ray.json";

const SOL_HACK_PROGRAM_ID = "2Q9NUwgrc3SC9k6y8DtMJ96U2p5Fa57X89JE2KjhDxM7"
// export function createTokenAccountIfnotExists(){
//     const a = new spl.Token()
// }

const USER_STAKE_INFO_ACCOUNT_LAYOUT_V4 = struct([
    u64("state"),
    publicKey("poolId"),
    publicKey("stakerOwner"),
    u64("depositBalance"),
    u64("rewardDebt"),
    u64("rewardDebtB"),
]);


export async function createTokenAccountIfNotExists(
    provider: anchor.Provider,
    account: string | undefined | null,
    owner: anchor.web3.PublicKey,
    mintAddress: string,
    lamports: number | null,

    instructions: anchor.web3.TransactionInstruction[]
) {
    let publicKey;

    if (account) {
        publicKey = new anchor.web3.PublicKey(account);
    } else {
        publicKey = await createProgramAccountIfNotExists(
            provider,
            account,
            owner,
            TOKEN_PROGRAM_ID,
            lamports,
            ACCOUNT_LAYOUT,
            instructions,
        );

        instructions.push(
            initializeAccount({
                account: publicKey,
                mint: new anchor.web3.PublicKey(mintAddress),
                owner,
            })
        )
    }

    return publicKey;
}


export async function createProgramAccountIfNotExists(
    provider: anchor.Provider,
    account: string | undefined | null,
    owner: anchor.web3.PublicKey,
    programId: anchor.web3.PublicKey,
    lamports: number | null,
    layout: any,

    instructions: anchor.web3.TransactionInstruction[]
) {
    let publicKey;

    if (account) {
        publicKey = new anchor.web3.PublicKey(account);
    } else {
        const newAccount = anchor.web3.Keypair.generate();
        publicKey = newAccount.publicKey;


        const ix = anchor.web3.SystemProgram.createAccount({
            fromPubkey: provider.wallet.publicKey,
            newAccountPubkey: publicKey,
            space: layout.span,
            lamports: lamports ?? (await provider.connection.getMinimumBalanceForRentExemption(
                layout.span
            )),
            programId,
        });

        instructions.push(ix);

    }

    return publicKey;
}



export async function initializeValut(
    connection: Connection | undefined | null,
    wallet: any | undefined | null,

) {
    if (!connection || !wallet) throw new Error('Miss connection');

    const provider = new anchor.Provider(connection, wallet, { commitment: commitment })
    anchor.setProvider(provider);

    const programId = new anchor.web3.PublicKey(
        SOL_HACK_PROGRAM_ID
    );
    const program = new anchor.Program(
        idl as anchor.Idl,
        programId,
        provider
    );

    let vaultAccount = anchor.web3.Keypair.generate();
    const [vaultSigner, nonce] = await anchor.web3.PublicKey.findProgramAddress(
        [vaultAccount.publicKey.toBuffer()],
        program.programId
    );

    const vaultTokenMintAddress = await spl.Token.createMint(
        provider.connection,
        provider.wallet.payer,
        vaultSigner,
        provider.wallet.publicKey,
        6,
        spl.TOKEN_PROGRAM_ID
    );


}


export async function deposit(
    connection: Connection | undefined | null,
    wallet: any | undefined | null,
    farmInfo: FarmInfo | undefined | null,
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


    const provider = new anchor.Provider(connection, wallet, { commitment: commitment })
    anchor.setProvider(provider);

    const owner = provider.wallet.publicKey;
    const RAYDIUM_PROGRAM_ID = new anchor.web3.PublicKey(farmInfo.programId);
    let instructions: anchor.web3.TransactionInstruction[] = [];

    const programId = new anchor.web3.PublicKey(
        SOL_HACK_PROGRAM_ID
    );
    const program = new anchor.Program(
        idl as anchor.Idl,
        programId,
        provider
    );

    let userRewardTokenAccount = await createTokenAccountIfNotExists(
        provider,
        rewardAccount,
        owner,
        farmInfo.reward.mintAddress,
        null,
        instructions,
    );
    // if (rewardAccount) {
    //     userRewardTokenAccount = new anchor.web3.PublicKey(rewardAccount)
    // } else {
    //     userRewardTokenAccount = anchor.web3.Keypair.generate().publicKey;
    //     const createUserRewardTokenAccountIx = anchor.web3.SystemProgram.createAccount({
    //         fromPubkey: provider.wallet.publicKey,
    //         newAccountPubkey: userRewardTokenAccount,
    //         space: USER_STAKE_INFO_ACCOUNT_LAYOUT_V4.span,
    //         lamports: await provider.connection.getMinimumBalanceForRentExemption(
    //             USER_STAKE_INFO_ACCOUNT_LAYOUT_V4.span
    //         ),
    //         programId: new anchor.web3.PublicKey(RAYDIUM_PROGRAM_ID),
    //     });

    //     instructions.push(createUserRewardTokenAccountIx);
    // }

    let userRewardTokenAccountB = await createTokenAccountIfNotExists(
        provider,
        rewardAccountB,
        owner,
        // @ts-ignore
        farmInfo.rewardB.mintAddress,
        null,
        instructions,
    );
    // if (rewardAccountB) {
    //     userRewardTokenAccountB = new anchor.web3.PublicKey(rewardAccountB);
    // } else {
    //     userRewardTokenAccountB = anchor.web3.Keypair.generate().publicKey;
    //     const createUserRewardTokenAccountBIx = anchor.web3.SystemProgram.createAccount({
    //         fromPubkey: provider.wallet.publicKey,
    //         newAccountPubkey: userRewardTokenAccountB,
    //         space: USER_STAKE_INFO_ACCOUNT_LAYOUT_V4.span,
    //         lamports: await provider.connection.getMinimumBalanceForRentExemption(
    //             USER_STAKE_INFO_ACCOUNT_LAYOUT_V4.span
    //         ),
    //         programId: new anchor.web3.PublicKey(RAYDIUM_PROGRAM_ID),
    //     });

    //     instructions.push(createUserRewardTokenAccountBIx);
    // }


    let userInfoAccount = await createProgramAccountIfNotExists(
        provider,
        infoAccount,
        owner,
        RAYDIUM_PROGRAM_ID,
        null,
        USER_STAKE_INFO_ACCOUNT_LAYOUT_V4,
        instructions,
    )
    // if (infoAccount) {
    //     userInfoAccount = new anchor.web3.PublicKey(infoAccount);
    // } else {
    //     userInfoAccount = anchor.web3.Keypair.generate().publicKey;
    //     const createUserInfoAccountIx = anchor.web3.SystemProgram.createAccount({
    //         fromPubkey: provider.wallet.publicKey,
    //         newAccountPubkey: userInfoAccount,
    //         space: USER_STAKE_INFO_ACCOUNT_LAYOUT_V4.span,
    //         lamports: await provider.connection.getMinimumBalanceForRentExemption(
    //             USER_STAKE_INFO_ACCOUNT_LAYOUT_V4.span
    //         ),
    //         programId: new anchor.web3.PublicKey(RAYDIUM_PROGRAM_ID),
    //     });

    //     instructions.push(createUserInfoAccountIx);
    // }

    const value = new TokenAmount(amount, farmInfo.lp.decimals, false).wei.toNumber()



    return program.rpc.deposit(new anchor.BN(value), {
        accounts: {
            // userInfoAccount: userInfoAccount,
            // userOwner: owner,
            // userLpTokenAccount: new anchor.web3.PublicKey(lpAccount),
            // userRewardTokenAccount,
            // userRewardTokenAccountB,
            // raydiumProgram: RAYDIUM_PROGRAM_ID,
            // raydiumPoolId: new anchor.web3.PublicKey(farmInfo.poolId),
            // raydiumPoolAuthority: new anchor.web3.PublicKey(farmInfo.poolAuthority),
            // raydiumLpTokenAccount: new anchor.web3.PublicKey(farmInfo.poolLpTokenAccount),
            // raydiumRewardTokenAccount: new anchor.web3.PublicKey(farmInfo.poolRewardTokenAccount),
            //             

            // raydiumRewardTokenAccountB: new anchor.web3.PublicKey(farmInfo.poolRewardTokenAccountB),
            // tokenProgram: spl.TOKEN_PROGRAM_ID,
            // clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            vaultAccount: vaultAccount.publicKey,
            vaultSigner: owner,
            vaultTokenMintAddress: vaultTokenMintAddress.publicKey,
            vaultUserInfoAccount: userInfoAccount,
            vaultLpTokenAccount: new anchor.web3.PublicKey(lpAccount),
            vaultRewardTokenAccount: userRewardTokenAccount,
            vaultRewardTokenAccountB: userRewardTokenAccountB,
            raydiumProgram: RAYDIUM_PROGRAM_ID,
            raydiumPoolId: new anchor.web3.PublicKey(farmInfo.poolId),
            raydiumPoolAuthority: new anchor.web3.PublicKey(farmInfo.poolAuthority),
            raydiumLpTokenAccount: new anchor.web3.PublicKey(farmInfo.poolLpTokenAccount),
            raydiumRewardTokenAccount: new anchor.web3.PublicKey(farmInfo.poolRewardTokenAccount),
            // @ts-ignore
            raydiumRewardTokenAccountB: new anchor.web3.PublicKey(farmInfo.poolRewardTokenAccountB),
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [userInfoAccount],
        instructions,
    })


}