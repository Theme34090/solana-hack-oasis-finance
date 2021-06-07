import * as anchor from "@project-serum/anchor";
import { TokenInstructions } from "@project-serum/serum";
import * as spl from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection } from "@solana/web3.js";


import { commitment } from "./web3";
import { FarmInfo } from "./farms";
import { TokenAmount } from "./safe-math";
import idl from "./idl.json";

const SOL_HACK_PROGRAM_ID = "HWLDk7fhugF9KpDpXjx3oggDeGYxsEwnJJGokuGQksMc"

const VAULT_ACCOUNT = "6DVVaFe94nHdRwpDtj7hcb6GBHDZE19Ru3DrD9kN9hCa"
const VAULT_SIGNER = "AQ3MAygTd4yn85xpaP9Y6d3dA7up5JLYXoc8kYgET3Th"
const VAULT_TOKEN_MINT_ADDRESS = "2zNEXCccDy7231c37m92FZg63d5NYGfngG5szY7AfTyP"
const vaultUserInfoAccount = "7Wa2qLXcnPYUxXtgHHsB2Sded9BmJXzrfovru77LuVvx"
const vaultLpTokenAccount = "4y2jyuL8XmW61KTBQGrLLm6G4LJVkkr7RJKK6JE1KrGC"
const vaultRewardTokenAccount = "6zzZeUVPj78U8KdoY4gFavJEJBgjqt3F4fHPHd3PLECi"
const vaultRewardTokenAccountB = "DbrG528NvAUqBnqvsCU1Trj8Ex4JqFudxtwFWQzxR1b3"



async function createTokenAccount(provider: anchor.Provider, mint: anchor.web3.PublicKey, owner: anchor.web3.PublicKey) {
    const vault = anchor.web3.Keypair.generate();
    const tx = new anchor.web3.Transaction();
    tx.add(
        ...(await createTokenAccountInstrs(provider, vault.publicKey, mint, owner))
    );
    await provider.send(tx, [vault]);
    return vault.publicKey;
}

async function createTokenAccountInstrs(
    provider: anchor.Provider,
    newAccountPubkey: anchor.web3.PublicKey,
    mint: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey,
    lamports?: number,
) {
    if (!lamports) {
        lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
    }
    return [
        anchor.web3.SystemProgram.createAccount({
            fromPubkey: provider.wallet.publicKey,
            newAccountPubkey,
            space: 165,
            lamports,
            programId: TOKEN_PROGRAM_ID,
        }),
        TokenInstructions.initializeAccount({
            account: newAccountPubkey,
            mint,
            owner,
        }),
    ];
}

export async function deposit(
    connection: Connection | undefined | null,
    wallet: any | undefined | null,
    farmInfo: FarmInfo | undefined | null,
    lpAccount: string | undefined | null,
    vaultAccount: string | undefined | null,
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


    const programId = new anchor.web3.PublicKey(
        SOL_HACK_PROGRAM_ID
    );

    const program = new anchor.Program(
        idl as anchor.Idl,
        programId,
        provider
    );

    let userVaultAccount;
    if (vaultAccount) {
        userVaultAccount = new anchor.web3.PublicKey(vaultAccount);
    } else {
        userVaultAccount = await createTokenAccount(
            provider,
            new anchor.web3.PublicKey(VAULT_TOKEN_MINT_ADDRESS),
            owner,
        )
    }

    const value = new TokenAmount(amount, farmInfo.lp.decimals, false).wei.toNumber()


    return program.rpc.deposit(new anchor.BN(value), {
        accounts: {

            vaultAccount: new anchor.web3.PublicKey(VAULT_ACCOUNT),
            vaultSigner: new anchor.web3.PublicKey(VAULT_SIGNER),
            vaultTokenMintAddress: new anchor.web3.PublicKey(VAULT_TOKEN_MINT_ADDRESS),
            vaultUserInfoAccount: new anchor.web3.PublicKey(vaultUserInfoAccount),
            vaultLpTokenAccount: new anchor.web3.PublicKey(vaultLpTokenAccount),
            vaultRewardTokenAccount: new anchor.web3.PublicKey(vaultRewardTokenAccount),
            vaultRewardTokenAccountB: new anchor.web3.PublicKey(vaultRewardTokenAccountB),
            // user
            userLpTokenAccount: new anchor.web3.PublicKey(lpAccount),
            // userVaultTokenAccount: new anchor.web3.PublicKey("Gsjaqjiej6hcDm2q7bpPAGsJBhGJCSE3efcEHqMAcBcF"),
            userVaultTokenAccount: userVaultAccount,
            userSigner: owner,

            raydiumProgram: RAYDIUM_PROGRAM_ID,
            raydiumPoolId: new anchor.web3.PublicKey(farmInfo.poolId),
            raydiumPoolAuthority: new anchor.web3.PublicKey(farmInfo.poolAuthority),
            raydiumLpTokenAccount: new anchor.web3.PublicKey(farmInfo.poolLpTokenAccount),
            raydiumRewardTokenAccount: new anchor.web3.PublicKey(farmInfo.poolRewardTokenAccount),
            // @ts-ignore
            raydiumRewardTokenAccountB: new anchor.web3.PublicKey(farmInfo.poolRewardTokenAccountB),
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        },
    })

}




export async function withdraw(
    connection: Connection | undefined | null,
    wallet: any | undefined | null,
    farmInfo: FarmInfo | undefined | null,
    lpAccount: string | undefined | null,
    vaultAccount: string | undefined | null,
    amount: string | undefined | null
) {

    if (!connection || !wallet) throw new Error('Miss connection')
    if (!farmInfo) throw new Error('Miss pool infomations')
    if (!lpAccount || !vaultAccount) throw new Error('Miss account infomations')
    if (!amount) throw new Error('Miss amount infomations')

    const provider = new anchor.Provider(connection, wallet, { commitment: commitment })
    anchor.setProvider(provider);

    const owner = provider.wallet.publicKey;
    const RAYDIUM_PROGRAM_ID = new anchor.web3.PublicKey(farmInfo.programId);

    const programId = new anchor.web3.PublicKey(
        SOL_HACK_PROGRAM_ID
    );
    const program = new anchor.Program(
        idl as anchor.Idl,
        programId,
        provider
    );


    const value = new TokenAmount(amount, farmInfo.lp.decimals, false).wei.toNumber()

    return program.rpc.withdraw(new anchor.BN(value), {
        accounts: {
            vaultAccount: new anchor.web3.PublicKey(VAULT_ACCOUNT),
            vaultSigner: new anchor.web3.PublicKey(VAULT_SIGNER),
            vaultTokenMintAddress: new anchor.web3.PublicKey(VAULT_TOKEN_MINT_ADDRESS),
            vaultUserInfoAccount: new anchor.web3.PublicKey(vaultUserInfoAccount),
            vaultLpTokenAccount: new anchor.web3.PublicKey(vaultLpTokenAccount),
            vaultRewardTokenAccount: new anchor.web3.PublicKey(vaultRewardTokenAccount),
            vaultRewardTokenAccountB: new anchor.web3.PublicKey(vaultRewardTokenAccountB),

            // user
            userLpTokenAccount: new anchor.web3.PublicKey(lpAccount),
            userVaultTokenAccount: new anchor.web3.PublicKey(vaultAccount),
            userSigner: owner,

            raydiumProgram: RAYDIUM_PROGRAM_ID,
            raydiumPoolId: new anchor.web3.PublicKey(farmInfo.poolId),
            raydiumPoolAuthority: new anchor.web3.PublicKey(farmInfo.poolAuthority),
            raydiumLpTokenAccount: new anchor.web3.PublicKey(farmInfo.poolLpTokenAccount),
            raydiumRewardTokenAccount: new anchor.web3.PublicKey(farmInfo.poolRewardTokenAccount),
            // @ts-ignore
            raydiumRewardTokenAccountB: new anchor.web3.PublicKey(farmInfo.poolRewardTokenAccountB),
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        },

    })
}