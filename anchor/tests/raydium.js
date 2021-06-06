// const anchor = require("@project-serum/anchor");
// const { createMint } = require("@project-serum/common");
// const spl = require("@solana/spl-token");
// const assert = require("assert");
// const {
//     mintToAccount,
//     getTokenAccount,
//     createTokenAccount,
// } = require("./utils");

// describe("test vault", () => {
//     const provider = anchor.Provider.env();
//     anchor.setProvider(provider);
//     const program = anchor.workspace.Vault;

//     const RAYDIUM_PROGRAM_ID = "EcLzTrNg9V7qhcdyXDe2qjtPkiGzDM2UbdRaeaadU5r2";
//     const POOL_ID = "2Bsexc5j6vk4r9RhBYz2ufPrRWhumXQk6efXucqUKsyr";
//     const POOL_AUTHORITY = "BxAtWJ4g6xguPsR9xNvXTK7EjuzwiKNbmKbhoXDZ3EsY";
//     const NONCE = 254;
//     const RAYDIUM_LP_VAULT_ADDRESS =
//         "83BEhzv7eV4HeJuuPtYmHkhTjZEpNpK83mHnHfX5Krwj";
//     const RAYDIUM_REWARD_A = "HVtAJ1uRiWJ7tNU9uqAzpPv14B3fN9SVEW9G4PtM77Ci";
//     const RAYDIUM_REWARD_B = "39Ea6rMGGrsNmEsYToqQfEyNSqv7hcUJa646qBYLY4yq";

//     const USER_LP_TOKEN_ACC = "8FbDqmo5icpAdUHk2rJFjMp6oMd3i8rQimtGqY1DC6tF";
//     const USER_TOKEN_A_ACC = "AzrCx5xaxSRRw35P7P6psqW1mB8SmuqQc5USiXAdA1eE";
//     const USER_TOKEN_B_ACC = "2QxHHmuKLAGsZLqWtD995ewMtYV3ATKWXDnMMM2VGeev";

//     const TOKEN_A_MINT = "BEcGFQK1T1tSu3kvHC17cyCkQ5dvXqAJ7ExB2bb5Do7a";
//     const TOKEN_B_MINT = "FSRvxBNrQWX2Fy2qvKMLL3ryEdRtE3PUTZBcdKwASZTU";

//     let userInfoAccount;
//     let userRewardA;
//     let userRewardB;

//     it("farm", async () => {
//         userInfoAccount = anchor.web3.Keypair.generate();
//         userRewardA = await createTokenAccount(
//             provider,
//             TOKEN_A_MINT,
//             provider.wallet.publicKey
//         );
//         userRewardB = await createTokenAccount(
//             provider,
//             TOKEN_B_MINT,
//             provider.wallet.publicKey
//         );
//         const amount = new anchor.BN(1);

//         await program.rpc.farmv4(amount, {
//             accounts: {
//                 raydiumProgram: RAYDIUM_PROGRAM_ID,
//                 raydiumPoolId: POOL_ID,
//                 raydiumAuthority: POOL_AUTHORITY,
//                 userInfoAccount: userInfoAccount.publicKey,
//                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//                 userAuthority: provider.wallet.publicKey,
//                 userLpTokenAccount: USER_LP_TOKEN_ACC,
//                 raydiumLpTokenAccount: RAYDIUM_LP_VAULT_ADDRESS,
//                 userRewardTokenAccount: userRewardA,
//                 raydiumRewardTokenAccount: RAYDIUM_REWARD_A,
//                 tokenProgram: spl.TOKEN_PROGRAM_ID,
//                 clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
//                 userRewardTokenAccountB: userRewardB,
//                 raydiumRewardTokenAccountB: RAYDIUM_REWARD_B,
//             },
//             signers: [userInfoAccount],
//             instructions: [
//                 await program.account.raydiumUserInfoAccountV4.createInstruction(
//                     userInfoAccount
//                 ),
//             ],
//         });
//     });
// });
