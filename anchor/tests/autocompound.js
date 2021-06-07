const anchor = require("@project-serum/anchor");
const Market = require("@project-serum/serum").Market;
const web3 = require("@project-serum/anchor").web3;
const BN = require("@project-serum/anchor").BN;
const PublicKey = web3.PublicKey;
const Transaction = require("@project-serum/anchor").web3.Transaction;
const OpenOrders = require("@project-serum/serum").OpenOrders;
const TOKEN_PROGRAM_ID = require("@solana/spl-token").TOKEN_PROGRAM_ID;
const readFileSync = require("fs").readFileSync

const DEX_PID = new PublicKey("DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY");

describe("test autocompound", () => {
    const provider = anchor.Provider.local("https://api.devnet.solana.com");
    anchor.setProvider(provider);
    
    // const MARKET_ID = "3tsrPhKrWHWMB8RiPaqNxJ8GnBhZnDqL4wcu5EAMFeBe";  // COIN/X
    // const coinMint = "BEcGFQK1T1tSu3kvHC17cyCkQ5dvXqAJ7ExB2bb5Do7a";  // COIN
    // const pcMint = "FSRvxBNrQWX2Fy2qvKMLL3ryEdRtE3PUTZBcdKwASZTU";  // X
    const SWAP_PID = "B6URxgGFQP9dVDVEdhveLsszZrRjYKMV7VD6vEWfxmvV";
    const SWAP_IDL = "target/idl/swap.json";
    const AUTOCOMPOUND_PID = "3uAa11DScJgik8H4HkCzbTWVJ4TUgTEcumczYR3HiMqg";
    const AUTOCOMPOUND_IDL = "target/idl/autocompound.json";
    const MARKET_ID = "9afBGdJBBCyVJcZHXjGg19d1VTej3JRQhHUr8eQBqSXE";  // COIN/X

    const swap_program = new anchor.Program(
        JSON.parse(readFileSync(SWAP_IDL, "utf8")), 
        new PublicKey(SWAP_PID), 
        provider
    )
    const autocompound_program = new anchor.Program(
        JSON.parse(readFileSync(AUTOCOMPOUND_IDL, "utf8")), 
        new PublicKey(AUTOCOMPOUND_PID), 
        provider
    )
    

    it("swap", async () => {
        const market = await loadMarket(provider, MARKET_ID);
        const baseTokenAddress = await getVaultFromMint(provider, market._decoded.baseMint);
        const quoteTokenAddress = await getVaultFromMint(provider, market._decoded.quoteMint);

        const [vaultSigner] = await getVaultSignerAndNonce(market._decoded.ownAddress);
        const marketVaultSigner = vaultSigner;
        const openOrders = await generateOpenOrder(provider, market);

        await autocompound_program.rpc.autocompound(
            {
                accounts: {
                    vaultRewardTokenAccount: new PublicKey(baseTokenAddress),
                    swapProgram: swap_program._programId,
                    market: market._decoded.ownAddress,
                    openOrders: openOrders.publicKey,
                    requestQueue: market._decoded.requestQueue,
                    eventQueue: market._decoded.eventQueue,
                    bids: market._decoded.bids,
                    asks: market._decoded.asks,
                    orderPayerTokenAccount: new PublicKey(quoteTokenAddress), //  user's token wallet holding `from` token
                    coinVault: market._decoded.baseVault,
                    pcVault: market._decoded.quoteVault,
                    vaultSigner: marketVaultSigner,
                    // user params
                    coinWallet: new PublicKey(baseTokenAddress),  // user's token wallet holding `to` token
                    authority: provider.wallet.publicKey,
                    pcWallet: new PublicKey(quoteTokenAddress),
                    dexProgram: DEX_PID,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY
                },
                    
            });
        })
    })


//// MARKET ////
const loadMarket = async (provider, marketPublicKey) => {
    const market = await Market.load(
        provider.connection,  // connection
        new PublicKey(marketPublicKey),  // marketAddress
        {},  // marketOptions
        DEX_PID  // programId
    )
    return market
}

const getVaultSignerAndNonce = async (marketPublicKey) => {
    const nonce = new BN(0);
    while (nonce.toNumber() < 255) {
        try {
            const vaultOwner = await PublicKey.createProgramAddress(
                [marketPublicKey.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)],
                DEX_PID
            );
            return [vaultOwner, nonce];
        } catch (e) {}
        nonce.iaddn(1);
    }
    throw Error("Unable to find nonce");
}

const getAsksPrice = async (provider, market) => {
    // TODO: dynamically adjust for different ask size
    const asks_orderbook = await market.loadAsks(provider.connection);
    return asks_orderbook.getL2(10);
}

const getBidsPrice = async (provider, market) => {
    // TODO: dynamically adjust for different bid size
    const bids_orderbook = await market.loadBids(provider.connection);
    return bids_orderbook.getL2(10);
}

//// TOKEN ////
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

//// SWAP ////
const generateOpenOrder = async (provider, market) => {
    const openOrder = anchor.web3.Keypair.generate();
    const createAccouontTransaction = new Transaction();

    // create account
    createAccouontTransaction.add(
        await OpenOrders.makeCreateAccountTransaction(
            provider.connection,
            market._decoded.ownAddress,
            provider.wallet.publicKey,
            openOrder.publicKey,
            DEX_PID
        )
    )
    const transactionsAndSigners = [{ transaction: createAccouontTransaction, signers: [openOrder]}];
    await sendTransactions(transactionsAndSigners, provider.wallet, provider.connection);

    return openOrder;
}

//// TRANSACTIONS ////
const sendTransactions = async (transactionsAndSigners, wallet, connection) => {
    const blockhash = (await connection.getRecentBlockhash("max")).blockhash;
    transactionsAndSigners.forEach(({ transaction, signers = [] }) => {
        transaction.recentBlockhash = blockhash;
        transaction.setSigners(
            wallet.publicKey,
            ...signers.map((s) => s.publicKey)
        );
        if (signers?.length > 0) {
            transaction.partialSign(...signers);
        }
    });

    const signedTransactions = await wallet.signAllTransactions(
        transactionsAndSigners.map(({ transaction }) => transaction)
    );

    for (let signedTransaction of signedTransactions) {
        await sendAndConfirmRawTransaction(
            connection,
            signedTransaction.serialize()
        );
    }
}

const sendAndConfirmRawTransaction = async (connection, raw, commitment = "recent") => {
    let tx = await connection.sendRawTransaction(raw, { skipPreflight: true });
    return await connection.confirmTransaction(tx, commitment);
}