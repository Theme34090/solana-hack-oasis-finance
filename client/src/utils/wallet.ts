import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AccountInfo, Connection, ParsedAccountData, PublicKey } from "@solana/web3.js";
import { lt, TokenAmount } from "./safe-math";
import { NATIVE_SOL } from "./tokens";

export interface TokenAccounts {
    [key: string]: {
        balance: TokenAmount;
        tokenAccountAddress: string;
    }
}

export const getTokenAccounts = async (
    connection: Connection | null | undefined,
    wallet: any | undefined | null,
): Promise<TokenAccounts> => {
    if (!connection || !wallet) {
        return {};
    }

    const parsedTokenAccounts: any =
        await connection
            .getParsedTokenAccountsByOwner(
                wallet.publicKey,
                {
                    programId: TOKEN_PROGRAM_ID,
                },
                'confirmed'
            )

    const tokenAccounts: any = {}
    parsedTokenAccounts.value.forEach(
        (tokenAccountInfo: { pubkey: PublicKey; account: AccountInfo<ParsedAccountData> }) => {
            const tokenAccountAddress = tokenAccountInfo.pubkey.toBase58();
            const parsedInfo = tokenAccountInfo.account.data.parsed.info;
            const mintAddress = parsedInfo.mint;
            const balance = new TokenAmount(parsedInfo.tokenAmount.amount, parsedInfo.tokenAmount.decimals);

            if (Object.prototype.hasOwnProperty.call(tokenAccounts, mintAddress)) {
                if (lt(tokenAccounts[mintAddress].balance.wei.toNumber(), balance.wei.toNumber())) {
                    tokenAccounts[mintAddress] = {
                        tokenAccountAddress,
                        balance
                    }
                }
            } else {
                tokenAccounts[mintAddress] = {
                    tokenAccountAddress,
                    balance
                }
            }
        }
    )

    const solBalance = await connection.getBalance(wallet.publicKey, 'confirmed')
    tokenAccounts[NATIVE_SOL.mintAddress] = {
        tokenAccountAddress: wallet.publicKey.toBase58(),
        balance: new TokenAmount(solBalance, NATIVE_SOL.decimals)
    };

    return tokenAccounts;
}

// export const setTokenAccount(wallet: WalletAdapter, tokenAccounts: any) => {

// }