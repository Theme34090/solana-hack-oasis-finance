const anchor = require("@project-serum/anchor");
const spl = require("@solana/spl-token");
const assert = require("assert");

describe("test vault", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.Provider.local();
    const wallet = anchor.Wallet.local();
    anchor.setProvider(provider);

    const program = anchor.workspace.Vault;

    it("is initialized", async () => {
        const vaultAccount = anchor.web3.Keypair.generate();

        const [vaultSigner, nonce] =
            await anchor.web3.PublicKey.findProgramAddress(
                [wallet.publicKey.toBuffer()],
                program.programId
            );
        const vaultMint = await spl.Token.createMint(
            provider.connection,
            wallet.payer,
            vaultSigner,
            provider.wallet.publicKey,
            6,
            spl.TOKEN_PROGRAM_ID
        );
        console.log("here");
        await program.rpc.initialize(nonce, {
            accounts: {
                vaultAccount: vaultAccount.publicKey,
                vaultSigner,
                vaultMint: vaultMint.publicKey,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
            signers: [vaultAccount],
            instructions: [
                await program.account.vaultAccount.createInstruction(
                    vaultAccount
                ),
            ],
        });

        // const acc = await program.account.vaultAccount.fetch(
        //     vaultAccount.publicKey
        // );
        // assert.ok(acc.data.eq(data));
    });

    // it("create mint", async () => {
    //     const program = anchor.workspace.Vault;
    //     console.log(`program id: ${program.programId}`);
    //     const mint = await spl.Token.createMint(
    //         provider.connection,
    //         wallet.payer,
    //         program.programId,
    //         provider.wallet.publicKey,
    //         5,
    //         spl.TOKEN_PROGRAM_ID
    //     );
    // });
});
