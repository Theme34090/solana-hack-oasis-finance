const BN = require("@project-serum/anchor").BN;
const serumCmn = require("@project-serum/common");
const TOKEN_PROGRAM_ID = require("@solana/spl-token").TOKEN_PROGRAM_ID;
const SYSTEM_PROGRAM = require("@solana/web3.js").SYSTEM_PROGRAM;

const getVaultFromMint = async (provider, mintAddress) => {
    const parsedTokenAccounts = await provider.connection.getParsedTokenAccountsByOwner(
        provider.wallet.publicKey,
        { programId: TOKEN_PROGRAM_ID },
        "confirmed"
    )

    for (let i = 0; i < parsedTokenAccounts.value.length; i++) {
        const tokenAccountInfo = parsedTokenAccounts.value[i];
        const tokenAccountAddress = tokenAccountInfo.pubkey.toString();
        const checkMintAddress = tokenAccountInfo.account.data.parsed.info.mint;
        if (checkMintAddress === mintAddress.toString()) {
            return tokenAccountAddress;
        }
    }
    // TODO: create mint account if not found
    throw Error("Wallet cannot find token address for " + mintAddress + ". Please add token to your sollet first.")
}

module.exports = {
    getVaultFromMint
}