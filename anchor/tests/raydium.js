const anchor = require("@project-serum/anchor");
const { createMint, createTokenAccount } = require("@project-serum/common");
const spl = require("@solana/spl-token");
const assert = require("assert");
const { mintToAccount, getTokenAccount } = require("./utils");

describe("test vault", () => {
    const provider = anchor.Provider.local();
    const wallet = anchor.Wallet.local();
    anchor.setProvider(provider);
    const program = anchor.workspace.Vault;

    const RAYDIUM_PROGRAM_ID = "EcLzTrNg9V7qhcdyXDe2qjtPkiGzDM2UbdRaeaadU5r2";
    const POOL_ID = "2Bsexc5j6vk4r9RhBYz2ufPrRWhumXQk6efXucqUKsyr";
    const POOL_AUTHORITY = "BxAtWJ4g6xguPsR9xNvXTK7EjuzwiKNbmKbhoXDZ3EsY";
    const NONCE = 254;
    const RAYDIUM_LP_VAULT_ADDRESS =
        "83BEhzv7eV4HeJuuPtYmHkhTjZEpNpK83mHnHfX5Krwj";
    const RAYDIUM_REWARD_A = "HVtAJ1uRiWJ7tNU9uqAzpPv14B3fN9SVEW9G4PtM77Ci";
    const RAYDIUM_REWARD_B = "39Ea6rMGGrsNmEsYToqQfEyNSqv7hcUJa646qBYLY4yq";

    it("farm", async () => {
        await program.rpc.farmv4();
    });
});
