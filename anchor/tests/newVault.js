const anchor = require("@project-serum/anchor");
const { createMint } = require("@project-serum/common");
const spl = require("@solana/spl-token");
const { struct } = require("buffer-layout");
const { publicKey, u64 } = require("@project-serum/borsh");
const assert = require("assert");
const {
  mintToAccount,
  getTokenAccount,
  createTokenAccount,
} = require("./utils");
const idl = require("../target/idl/new_vault.json");

describe("test new vault", () => {
  const url = "https://api.devnet.solana.com";
  const preflightCommitment = "recent";
  const connection = new anchor.web3.Connection(url, preflightCommitment);
  const wallet = anchor.Wallet.local();

  const provider = new anchor.Provider(connection, wallet, {
    preflightCommitment,
    commitment: "recent",
  });
  anchor.setProvider(provider);
  // const program = anchor.workspace.NewVault;
  const program = new anchor.Program(
    idl,
    "2QGo9WwyXbFzyCnrob9XuLbEwqxmNhn4a58w4BxZBer5",
    provider
  );

  const RAYDIUM_PROGRAM_ID = "EcLzTrNg9V7qhcdyXDe2qjtPkiGzDM2UbdRaeaadU5r2";
  const POOL_ID = "2Bsexc5j6vk4r9RhBYz2ufPrRWhumXQk6efXucqUKsyr";
  const POOL_AUTHORITY = "BxAtWJ4g6xguPsR9xNvXTK7EjuzwiKNbmKbhoXDZ3EsY";
  const LP_MINT_ADDRESS = "14Wp3dxYTQpRMMz3AW7f2XGBTdaBrf1qb2NKjAN3Tb13";
  const lpTokenInstance = new spl.Token(
    provider.connection,
    LP_MINT_ADDRESS,
    spl.TOKEN_PROGRAM_ID,
    provider.wallet.payer
  );
  const RAYDIUM_LP_VAULT_ADDRESS =
    "83BEhzv7eV4HeJuuPtYmHkhTjZEpNpK83mHnHfX5Krwj";
  const RAYDIUM_REWARD_A = "HVtAJ1uRiWJ7tNU9uqAzpPv14B3fN9SVEW9G4PtM77Ci";
  const RAYDIUM_REWARD_B = "39Ea6rMGGrsNmEsYToqQfEyNSqv7hcUJa646qBYLY4yq";
  const USER_LP_TOKEN_ACC = "8FbDqmo5icpAdUHk2rJFjMp6oMd3i8rQimtGqY1DC6tF";
  const USER_TOKEN_A_ACC = "AzrCx5xaxSRRw35P7P6psqW1mB8SmuqQc5USiXAdA1eE";
  const USER_TOKEN_B_ACC = "2QxHHmuKLAGsZLqWtD995ewMtYV3ATKWXDnMMM2VGeev";

  const TOKEN_A_MINT = "BEcGFQK1T1tSu3kvHC17cyCkQ5dvXqAJ7ExB2bb5Do7a";
  const tokenAInstance = new spl.Token(
    provider.connection,
    TOKEN_A_MINT,
    spl.TOKEN_PROGRAM_ID,
    provider.wallet.payer
  );
  const TOKEN_B_MINT = "FSRvxBNrQWX2Fy2qvKMLL3ryEdRtE3PUTZBcdKwASZTU";
  const tokenBInstance = new spl.Token(
    provider.connection,
    TOKEN_B_MINT,
    spl.TOKEN_PROGRAM_ID,
    provider.wallet.payer
  );
  const USER_STAKE_INFO_ACCOUNT_LAYOUT_V4 = struct([
    u64("state"),
    publicKey("poolId"),
    publicKey("stakerOwner"),
    u64("depositBalance"),
    u64("rewardDebt"),
    u64("rewardDebtB"),
  ]);

  let vaultAccount;
  let vaultSigner;
  let vaultTokenMintAddress;
  let vaultUserInfoAccount;
  let vaultLpTokenAccount;
  let vaultRewardTokenAccount;
  let vaultRewardTokenAccountB;

  let userVaultTokenAccount;
  let userSigner = provider.wallet.publicKey;

  it("initialize vault", async () => {
    vaultAccount = anchor.web3.Keypair.generate();
    const [_vaultSigner, nonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [vaultAccount.publicKey.toBuffer()],
        program.programId
      );
    vaultSigner = _vaultSigner;
    vaultTokenMintAddress = await spl.Token.createMint(
      provider.connection,
      provider.wallet.payer,
      vaultSigner,
      provider.wallet.publicKey,
      6,
      spl.TOKEN_PROGRAM_ID
    );
    vaultUserInfoAccount = anchor.web3.Keypair.generate();
    vaultLpTokenAccount = await lpTokenInstance.createAccount(vaultSigner);
    vaultRewardTokenAccount = await tokenAInstance.createAccount(vaultSigner);
    vaultRewardTokenAccountB = await tokenBInstance.createAccount(vaultSigner);
    const createUserInfoAccountIx = anchor.web3.SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: vaultUserInfoAccount.publicKey,
      space: USER_STAKE_INFO_ACCOUNT_LAYOUT_V4.span,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(
        USER_STAKE_INFO_ACCOUNT_LAYOUT_V4.span
      ),
      programId: new anchor.web3.PublicKey(RAYDIUM_PROGRAM_ID),
    });
    const txSig = await program.rpc.initializeVault(nonce, {
      accounts: {
        vaultAccount: vaultAccount.publicKey,
        vaultSigner,
        vaultTokenMintAddress: vaultTokenMintAddress.publicKey,
        vaultUserInfoAccount: vaultUserInfoAccount.publicKey,
        vaultLpTokenAccount,
        vaultRewardTokenAccount,
        vaultRewardTokenAccountB,
        raydiumProgram: RAYDIUM_PROGRAM_ID,
        raydiumPoolId: POOL_ID,
        raydiumPoolAuthority: POOL_AUTHORITY,
        raydiumLpTokenAccount: RAYDIUM_LP_VAULT_ADDRESS,
        raydiumRewardTokenAccount: RAYDIUM_REWARD_A,
        raydiumRewardTokenAccountB: RAYDIUM_REWARD_B,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [vaultAccount, vaultUserInfoAccount],
      instructions: [
        await program.account.vaultAccount.createInstruction(vaultAccount),
        createUserInfoAccountIx,
      ],
    });
    console.log(txSig);

    const acc = await program.account.vaultAccount.fetch(
      vaultAccount.publicKey
    );
    assert.strictEqual(acc.nonce, nonce, "nonce not equal");
  });

  it("deposit", async () => {
    userVaultTokenAccount = await vaultTokenMintAddress.createAccount(
      userSigner
    );
    console.log("VAULT ACCOUNT: ", vaultAccount.publicKey);
    console.log("VAULT TOKEN MINT ADDRESS", vaultTokenMintAddress.publicKey);
    const amount = new anchor.BN(10000);
    const txSig = await program.rpc.deposit(amount, {
      accounts: {
        vaultAccount: vaultAccount.publicKey,
        vaultSigner,
        vaultTokenMintAddress: vaultTokenMintAddress.publicKey,
        vaultUserInfoAccount: vaultUserInfoAccount.publicKey,
        vaultLpTokenAccount,
        vaultRewardTokenAccount,
        vaultRewardTokenAccountB,
        // user
        userLpTokenAccount: USER_LP_TOKEN_ACC,
        userVaultTokenAccount,
        userSigner,
        // raydium
        raydiumProgram: RAYDIUM_PROGRAM_ID,
        raydiumPoolId: POOL_ID,
        raydiumPoolAuthority: POOL_AUTHORITY,
        raydiumLpTokenAccount: RAYDIUM_LP_VAULT_ADDRESS,
        raydiumRewardTokenAccount: RAYDIUM_REWARD_A,
        raydiumRewardTokenAccountB: RAYDIUM_REWARD_B,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      },
    });
    console.log(txSig);
  });
});
