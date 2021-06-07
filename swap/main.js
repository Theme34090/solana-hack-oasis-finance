const anchor = require("@project-serum/anchor");
const serumCmn = require("@project-serum/common");
const PublicKey = require("@project-serum/anchor").web3.PublicKey;
const OpenOrders = require("@project-serum/serum").OpenOrders;
const Transaction = require("@project-serum/anchor").web3.Transaction;

const loadMarket = require("./src/client/market").loadMarket;
const swapSell = require("./src/client/swap").swapSell;
const swapBuy = require("./src/client/swap").swapBuy;

const getBidsPrice = require("./src/client/market").getBidsPrice;
const getAsksPrice = require("./src/client/market").getAsksPrice;
const placeBid = require("./src/client/market").placeBid;
const placeAsk = require("./src/client/market").placeAsk;

const provider = require("./src/client/utils").provider;
const DEX_PID = require("./src/client/utils").DEX_PID;
const generateOpenOrder = require("./src/client/swap").generateOpenOrder;
const getVaultFromMint = require("./src/client/token").getVaultFromMint;

/////////// DEVNET ///////////

// wallet
// 85QREZn6MSCi7hNMHt3Cqf9QbbJGCKiG4KPYcKYXmJ4i

// TOKEN A (6 decimals)
// GOD: 8gZqyRV7uff9B8wtCHs8dK7iGkxVfLyrXeP36UpF9ZKY
// MINT: GR3Uc9r67ZY195k7yiCWPyF7X1K5kGVsdzHr1NbGaPvB

// TOKEN B (6 decimals)
// GOD: EwmYC86Us7t2QNDDPJyXakMZNg8rYod3tFK39kQAZ6az
// MINT: EFTURR7ZyVmKoS3L4XnaYAWDZkSbV6sTnEax7GpFADrs

// TOKEN USDC
// GOD: EkMv2FsQv8Btkb7EJP3ENr84uRg2Pra3VztPfm41quhF
// MINT: 2SKV7L3q4xwUqr8V6sj9ESu7bdr1FiaJD8whVWrMcUqZ

// market A/USDC
// 9afBGdJBBCyVJcZHXjGg19d1VTej3JRQhHUr8eQBqSXE

// market B/USDC
// S9XBxQ9EDCjcdUqFXBFg6ULMkJmsQikaes99Db8CXpW
const MARKET_ID = "3tsrPhKrWHWMB8RiPaqNxJ8GnBhZnDqL4wcu5EAMFeBe";  // COIN/X
const coinMint = "BEcGFQK1T1tSu3kvHC17cyCkQ5dvXqAJ7ExB2bb5Do7a";  // COIN
const pcMint = "FSRvxBNrQWX2Fy2qvKMLL3ryEdRtE3PUTZBcdKwASZTU";  // X

const displayBalanceOnMarket = async (provider, market) => {
    const baseVault = new PublicKey(await getVaultFromMint(provider, new PublicKey(market._decoded.baseMint)))
    const quoteVault = new PublicKey(await getVaultFromMint(provider, new PublicKey(market._decoded.quoteMint)))
    console.log("BASE Balance (" + market._decoded.baseMint + ") = " + (await serumCmn.getTokenAccount(provider, baseVault)).amount.toNumber())
    console.log("QUOTE Balance (" + market._decoded.quoteMint + ") = " + (await serumCmn.getTokenAccount(provider, quoteVault)).amount.toNumber())
}

const executeSwap = async () => {
    const swapAmount = 0.4;
    const slippage = 0.01;

    const market = await loadMarket(provider, MARKET_ID);

    // logging
    console.log("Account before swap:");
    displayBalanceOnMarket(provider, market);

    await swapBuy(
        provider,  // provider
        swapAmount, // swapAmount
        market, // market
        slippage // slippage
    )

    // logging
    console.log("Account after swap:");
    displayBalanceOnMarket(provider, market);
}

const placeBidsAndAsks = async () => {
    const providerCoinVault = await getVaultFromMint(provider, new PublicKey(coinMint));
    const providerPCVault = await getVaultFromMint(provider, new PublicKey(pcMint));
    const market = await loadMarket(provider, MARKET_ID);
    console.log("Market loaded");
    console.log("BASE: " + market._decoded.baseMint.toString());
    console.log("QUOTE: " + market._decoded.quoteMint.toString());
    let bids = await getBidsPrice(provider, market);
    let asks = await getAsksPrice(provider, market);

    console.log("BIDS");
    console.log(bids);
    console.log("ASKS");
    console.log(asks);

    // place bids/asks
    await placeBid(provider, market, 1.00, 15.1, 3000)
    await placeBid(provider, market, 0.98, 17.4, 3000)
    await placeBid(provider, market, 0.95, 21.2, 3000)
    await placeBid(provider, market, 0.93, 25.4, 3000)
    await placeBid(provider, market, 0.90, 30.0, 3000)

    await placeAsk(provider, market, 1.05, 21.1, 3000)
    await placeAsk(provider, market, 1.10, 35.5, 3000)
    await placeAsk(provider, market, 1.13, 45.2, 3000)
    await placeAsk(provider, market, 1.15, 75.4, 3000)
    await placeAsk(provider, market, 1.20, 101.2, 3000)

    console.log("BIDS");
    console.log(bids);
    console.log("ASKS");
    console.log(asks);
}

const main = async () => {
    const market = await loadMarket(provider, MARKET_ID);
    displayBalanceOnMarket(provider, market);
}

executeSwap();