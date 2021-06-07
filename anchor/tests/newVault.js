// const anchor = require("@project-serum/anchor");
// const { createMint } = require("@project-serum/common");
// const spl = require("@solana/spl-token");
// const assert = require("assert");
// const { mintToAccount, getTokenAccount, createTokenAccount } = require("./utils");

// describe("test new vault", () => {
//     const provider = anchor.Provider.env();
//     anchor.setProvider(provider);
//     const program = anchor.workspace.NewVault;

//     const RAYDIUM_PROGRAM_ID = "EcLzTrNg9V7qhcdyXDe2qjtPkiGzDM2UbdRaeaadU5r2";
//     const POOL_ID = "2Bsexc5j6vk4r9RhBYz2ufPrRWhumXQk6efXucqUKsyr";
//     const POOL_AUTHORITY = "BxAtWJ4g6xguPsR9xNvXTK7EjuzwiKNbmKbhoXDZ3EsY";
//     const LP_MINT_ADDRESS = "14Wp3dxYTQpRMMz3AW7f2XGBTdaBrf1qb2NKjAN3Tb13";
//     const lpTokenInstance = new spl.Token(
//         provider.connection,
//         LP_MINT_ADDRESS,
//         spl.TOKEN_PROGRAM_ID,
//         provider.wallet.payer
//     );
//     const RAYDIUM_LP_VAULT_ADDRESS = "83BEhzv7eV4HeJuuPtYmHkhTjZEpNpK83mHnHfX5Krwj";
//     const RAYDIUM_REWARD_A = "HVtAJ1uRiWJ7tNU9uqAzpPv14B3fN9SVEW9G4PtM77Ci";
//     const RAYDIUM_REWARD_B = "39Ea6rMGGrsNmEsYToqQfEyNSqv7hcUJa646qBYLY4yq";
//     //     const USER_LP_TOKEN_ACC = "8FbDqmo5icpAdUHk2rJFjMp6oMd3i8rQimtGqY1DC6tF";
//     //     const USER_TOKEN_A_ACC = "AzrCx5xaxSRRw35P7P6psqW1mB8SmuqQc5USiXAdA1eE";
//     //     const USER_TOKEN_B_ACC = "2QxHHmuKLAGsZLqWtD995ewMtYV3ATKWXDnMMM2VGeev";

//     const TOKEN_A_MINT = "BEcGFQK1T1tSu3kvHC17cyCkQ5dvXqAJ7ExB2bb5Do7a";
//     const tokenAInstance = new spl.Token(
//         provider.connection,
//         TOKEN_A_MINT,
//         spl.TOKEN_PROGRAM_ID,
//         provider.wallet.payer
//     );
//     const TOKEN_B_MINT = "FSRvxBNrQWX2Fy2qvKMLL3ryEdRtE3PUTZBcdKwASZTU";
//     const tokenBInstance = new spl.Token(
//         provider.connection,
//         TOKEN_B_MINT,
//         spl.TOKEN_PROGRAM_ID,
//         provider.wallet.payer
//     );

//     let vaultAccount;
//     let vaultSigner;
//     let vaultTokenMint;
//     let vaultLpTokenAccount;
//     let vaultRewardTokenAccount;
//     let vaultRewardTokenAccountB;
//     let vaultRaydiumUserInfoAccount;

//     it("deposit", async () => {
//         vaultAccount = anchor.web3.Keypair.generate();
//         vaultRaydiumUserInfoAccount = anchor.web3.Keypair.generate();
//         const [_vaultSigner, nonce] = await anchor.web3.PublicKey.findProgramAddress(
//             [vaultAccount.publicKey.toBuffer()],
//             program.programId
//         );
//         vaultSigner = _vaultSigner;
//         vaultTokenMint = await spl.Token.createMint(
//             provider.connection,
//             provider.wallet.payer,
//             vaultSigner,
//             null,
//             6,
//             spl.TOKEN_PROGRAM_ID
//         );
//         vaultLpTokenAccount = await lpTokenInstance.createAccount(vaultSigner);
//         vaultRewardTokenAccount = await tokenAInstance.createAccount(vaultSigner);
//         vaultRewardTokenAccountB = await tokenBInstance.createAccount(vaultSigner);

//         await program.rpc.initialize(nonce, {
//             accounts: {
//                 vaultAccount: vaultAccount.publicKey,
//                 vaultSigner,
//                 vaultTokenMint: vaultTokenMint.publicKey,
//                 vaultLpTokenAccount,
//                 vaultRewardTokenAccount,
//                 vaultRewardTokenAccountB,
//                 vaultRaydiumUserInfoAccount: vaultRaydiumUserInfoAccount.publicKey,
//                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//                 // raydium
//                 raydiumProgram: RAYDIUM_PROGRAM_ID,
//                 raydiumPoolId: POOL_ID,
//                 raydiumPoolAuthority: POOL_AUTHORITY,
//                 raydiumLpTokenAccount: RAYDIUM_LP_VAULT_ADDRESS,
//                 raydiumRewardTokenAccount: RAYDIUM_REWARD_A,
//                 raydiumRewardTokenAccountB: RAYDIUM_REWARD_B,
//                 tokenProgram: spl.TOKEN_PROGRAM_ID,
//                 clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
//             },
//             signers: [vaultAccount, vaultRaydiumUserInfoAccount],
//             instructions: [
//                 await program.account.vaultAccount.createInstruction(vaultAccount),
//                 await program.account.raydiumUserInfoAccount.createInstruction(vaultRaydiumUserInfoAccount),
//             ],
//         });

//         const acc = await program.account.vaultAccount.fetch(vaultAccount.publicKey);
//         assert.strictEqual(acc.nonce, nonce, "nonce not equal");
//     });
// });
