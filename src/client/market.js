const Market = require("@project-serum/serum").Market;
const web3 = require("@project-serum/anchor").web3;
const Account = web3.Account;
const BN = require("@project-serum/anchor").BN;
const PublicKey = web3.PublicKey;

const getVaultFromMint = require("./token").getVaultFromMint;
const DEX_PID = require("./utils").DEX_PID;

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

const placeBid = async (provider, market, price, quantity, sleepTime = 0) => {
    // place bid must be quoteToken on payer
    const payer = new PublicKey(
        await getVaultFromMint(provider, market._decoded.quoteMint)
    );
    const owner = new Account(provider.wallet.payer.secretKey)

    const { transaction, signers } = await market.makePlaceOrderTransaction(
        provider.connection, {
            owner: owner,
            payer: payer,
            side: "buy",
            price: price,
            size: quantity,
            orderType: "postOnly",
            clientId: undefined,
            openOrdersAddressKey: undefined,
            openOrdersAccount: undefined,
            feeDiscountPubkey: null,
            selfTradeBehavior: "abortTransaction",
        }
    );
    await provider.send(transaction, signers.concat(owner));
    console.log("Finished placing bid with price " + price + "and size " + quantity + ". Sleeping for " + sleepTime + " ms")
    sleep(sleepTime);
}

const placeAsk = async (provider, market, price, quantity, sleepTime = 0) => {
    // place ask must be baseToken on payer
    const payer = new PublicKey(
        await getVaultFromMint(provider, market._decoded.baseMint)
    );
    const owner = new Account(provider.wallet.payer.secretKey)
    
    const { transaction, signers } = await market.makePlaceOrderTransaction(
        provider.connection, {
            owner: owner,
            payer: payer,
            side: "sell",
            price: price,
            size: quantity,
            orderType: "postOnly",
            clientId: undefined,
            openOrdersAddressKey: undefined,
            openOrdersAccount: undefined,
            feeDiscountPubkey: null,
            selfTradeBehavior: "abortTransaction",
        }
    );
    await provider.send(transaction, signers.concat(owner));
    console.log("Finished placing ask with price " + price + "and size " + quantity + ". Sleeping for " + sleepTime + " ms")
    sleep(sleepTime);
}

module.exports = {
    loadMarket,
    getVaultSignerAndNonce,
    getAsksPrice,
    getBidsPrice,
    placeAsk,
    placeBid
}