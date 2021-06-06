// const anchor = require("@project-serum/anchor");
// const { createMint, createTokenAccount } = require("@project-serum/common");
// const spl = require("@solana/spl-token");
// const assert = require("assert");
// const { mintToAccount, getTokenAccount } = require("./utils");

// describe("test vault", () => {
//     const provider = anchor.Provider.local();
//     const wallet = anchor.Wallet.local();
//     anchor.setProvider(provider);
//     const program = anchor.workspace.Vault;

//     const amount = new anchor.BN(100);

//     let vaultAccount;
//     let vaultSigner;
//     let vaultTokenMint;
//     let vaultFarmLp;

//     let farmSigner = wallet.publicKey;
//     let farmLpMint;
//     let userFarmLp;
//     let userVaultToken;
//     let userSigner = wallet.publicKey;

//     it("initialize", async () => {
//         vaultAccount = anchor.web3.Keypair.generate();
//         const [_vaultSigner, nonce] =
//             await anchor.web3.PublicKey.findProgramAddress(
//                 [vaultAccount.publicKey.toBuffer()],
//                 program.programId
//             );
//         vaultSigner = _vaultSigner;
//         vaultTokenMint = await spl.Token.createMint(
//             provider.connection,
//             wallet.payer,
//             vaultSigner,
//             provider.wallet.publicKey,
//             6,
//             spl.TOKEN_PROGRAM_ID
//         );
//         farmLpMint = await spl.Token.createMint(
//             provider.connection,
//             wallet.payer,
//             farmSigner,
//             provider.wallet.publicKey,
//             6,
//             spl.TOKEN_PROGRAM_ID
//         );
//         vaultFarmLp = await farmLpMint.createAccount(vaultSigner);

//         await program.rpc.initialize(nonce, {
//             accounts: {
//                 vaultAccount: vaultAccount.publicKey,
//                 vaultSigner,
//                 vaultTokenMint: vaultTokenMint.publicKey,
//                 vaultFarmLp: vaultFarmLp,
//                 farmLpMint: farmLpMint.publicKey,
//                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//             },
//             signers: [vaultAccount],
//             instructions: [
//                 await program.account.vaultAccount.createInstruction(
//                     vaultAccount
//                 ),
//             ],
//         });

//         const acc = await program.account.vaultAccount.fetch(
//             vaultAccount.publicKey
//         );
//         assert.strictEqual(acc.nonce, nonce, "nonce not equal");
//     });

//     it("deposit", async () => {
//         userFarmLp = await farmLpMint.createAccount(userSigner);
//         userVaultToken = await vaultTokenMint.createAccount(userSigner);
//         await farmLpMint.mintTo(userFarmLp, farmSigner, [], amount.toNumber());

//         await program.rpc.deposit(amount, {
//             accounts: {
//                 vaultAccount: vaultAccount.publicKey,
//                 vaultSigner,
//                 vaultTokenMint: vaultTokenMint.publicKey,
//                 vaultFarmLp: vaultFarmLp,
//                 userAuthority: userSigner,
//                 userFarmLp,
//                 userVaultToken,
//                 tokenProgram: spl.TOKEN_PROGRAM_ID,
//                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//             },
//         });

//         assert.strictEqual(
//             await (
//                 await getTokenAccount(provider, userFarmLp)
//             ).amount.toNumber(),
//             0
//         );
//     });

//     it("withdraw", async () => {
//         await program.rpc.withdraw(amount, {
//             accounts: {
//                 vaultAccount: vaultAccount.publicKey,
//                 vaultSigner,
//                 vaultTokenMint: vaultTokenMint.publicKey,
//                 vaultFarmLp: vaultFarmLp,
//                 userAuthority: userSigner,
//                 userFarmLp,
//                 userVaultToken,
//                 tokenProgram: spl.TOKEN_PROGRAM_ID,
//                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//             },
//         });

//         assert.strictEqual(
//             await (
//                 await getTokenAccount(provider, userFarmLp)
//             ).amount.toNumber(),
//             amount.toNumber()
//         );
//     });
// });
