const BN = require("@project-serum/anchor").BN;
const serumCmn = require("@project-serum/common");
const PublicKey = require("@project-serum/anchor").web3.PublicKey;
const TOKEN_PROGRAM_ID = require("@solana/spl-token").TOKEN_PROGRAM_ID;
const anchor = require("@project-serum/anchor");
const OpenOrders = require("@project-serum/serum").OpenOrders;
const Transaction = require("@project-serum/anchor").web3.Transaction;

const loadMarket = require("./market").loadMarket;
const getVaultSignerAndNonce = require("./market").getVaultSignerAndNonce;
const getBidsPrice = require("./market").getBidsPrice;
const getAsksPrice = require("./market").getAsksPrice;
const sendTransactions = require("./transaction").sendTransactions;
const program = require("./utils").program;
const DEX_PID = require("./utils").DEX_PID;
const TAKER_FEE = require("./utils").TAKER_FEE;
const getVaultFromMint = require("./token").getVaultFromMint;

const Side = {
    Bid: { bid: {} },
    Ask: { ask: {} },
};

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

const swapBuy = async (provider, swapAmount, market, slippage) => {
    // get vaultSigner, openOrders
    const [vaultSigner] = await getVaultSignerAndNonce(market._decoded.ownAddress);
    const marketVaultSigner = vaultSigner;
    const openOrders = await generateOpenOrder(provider, market);

    // get base/quote Vault from wallet
    const baseTokenAddress = await getVaultFromMint(provider, market._decoded.baseMint);
    const quoteTokenAddress = await getVaultFromMint(provider, market._decoded.quoteMint);

    let asks = await getAsksPrice(provider, market);
    console.log("ASK");
    console.log(asks);

    const quoteMintInfo = await serumCmn.getMintInfo(provider, market._decoded.quoteMint);
    const decimals = quoteMintInfo.decimals;
    const bestOfferPrice = asks[0][0];
    const amountToSpend = swapAmount * bestOfferPrice;
    const minExpectedAmount = swapAmount * (1. - slippage);

    await program.rpc.swap(
        Side.Bid,  // side
        new BN((amountToSpend / (1 - TAKER_FEE)) * 10 ** decimals),  // swapAmount
        new BN(minExpectedAmount), // minExpectedAmount
        {
            accounts: {
                market: {
                    market: market._decoded.ownAddress,
                    requestQueue: market._decoded.requestQueue,
                    eventQueue: market._decoded.eventQueue,
                    bids: market._decoded.bids,
                    asks: market._decoded.asks,
                    coinVault: market._decoded.baseVault,
                    pcVault: market._decoded.quoteVault,
                    vaultSigner: marketVaultSigner,
                    // user params
                    openOrders: openOrders.publicKey,
                    orderPayerTokenAccount: new PublicKey(quoteTokenAddress), //  user's token wallet holding `from` token
                    coinWallet: new PublicKey(baseTokenAddress),  // user's token wallet holding `to` token
                },
                pcWallet: new PublicKey(quoteTokenAddress),
                authority: provider.wallet.publicKey,
                dexProgram: DEX_PID,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            },
        }
    );

    asks = await getAsksPrice(provider, market);
    console.log("ASK");
    console.log(asks);
}

const swapSell = async (provider, swapAmount, market, slippage) => {
    const [vaultSigner] = await getVaultSignerAndNonce(market._decoded.ownAddress);
    const marketVaultSigner = vaultSigner;
    const openOrders = await generateOpenOrder(provider, market);

    const baseTokenAddress = await getVaultFromMint(provider, market._decoded.baseMint);
    const quoteTokenAddress = await getVaultFromMint(provider, market._decoded.quoteMint);

    let bids = await getBidsPrice(provider, market);
    console.log("BID");
    console.log(bids);

    const baseMintInfo = await serumCmn.getMintInfo(provider, market._decoded.baseMint);
    const decimals = baseMintInfo.decimals;
    const minExpectedAmount = swapAmount * (1. - slippage);

    await program.rpc.swap(
        Side.Ask,  // side
        new BN(swapAmount * 10 ** decimals),  // swapAmount
        new BN(minExpectedAmount), // minExpectedAmount
        {
            accounts: {
                market: {
                    market: market._decoded.ownAddress,
                    requestQueue: market._decoded.requestQueue,
                    eventQueue: market._decoded.eventQueue,
                    bids: market._decoded.bids,
                    asks: market._decoded.asks,
                    coinVault: market._decoded.baseVault,  // vault for base
                    pcVault: market._decoded.quoteVault,  // vault for quote
                    vaultSigner: marketVaultSigner,  // PDA owner of DEX's token account
                    // user params
                    openOrders: openOrders.publicKey,
                    orderPayerTokenAccount: new PublicKey(baseTokenAddress),  // for bids: base currency, for ask: quote
                    coinWallet: new PublicKey(baseTokenAddress),  // user wallet
                },
                authority: provider.wallet.publicKey,
                pcWallet: new PublicKey(quoteTokenAddress),
                // programs
                dexProgram: DEX_PID,
                tokenProgram: TOKEN_PROGRAM_ID,
                // sysvars
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            }
        }
    );

    bids = await getBidsPrice(provider, market);
    console.log("BID");
    console.log(bids);
}

module.exports = {
    swapSell,
    swapBuy,
    generateOpenOrder
}