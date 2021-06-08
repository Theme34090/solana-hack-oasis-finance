const PublicKey = require("@project-serum/anchor").web3.PublicKey;
const Connection = require("@project-serum/anchor").web3.Connection;
const Keypair = require("@project-serum/anchor").web3.Keypair;
const anchor = require("@project-serum/anchor");
const readFileSync = require("fs").readFileSync;

// server
// const ANCHOR_PROVIDER_URL = "http://localhost:8899";
const ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com";
const WALLET_PATH = "/Users/chompk/WORK/others/solana/wallets/wallet1.json";
const secretKey = new Uint8Array(JSON.parse(readFileSync(WALLET_PATH)));
const provider = new anchor.Provider(
    new Connection(ANCHOR_PROVIDER_URL), 
    new anchor.Wallet(Keypair.fromSecretKey(secretKey)),
    anchor.Provider.defaultOptions()
);
console.log("Using wallet: " + provider.wallet.publicKey.toString());

// const DEX_PID = new PublicKey("BPRKEMiMozAE7s5528bLFD16RPkAMgboEwf2G9zKv2Eb");  // local serum dex PID
const DEX_PID = new PublicKey("DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY");  // dev net

// program
// const idl = JSON.parse(require('fs').readFileSync('target/idl/swap.json', 'utf8'));
const idl = JSON.parse(readFileSync("../anchor/target/idl/swap.json", "utf8"));
const programId = new PublicKey("2oTzdZ2xLfpKyPpGRf5hVw5VwovmWXpf6mBpt6MbYWPf");  // dev net
// const programId = new PublicKey("2TvVLqjS3xU9aHJJ9bKJHmSnqemW5R2dSt8TY4UmUE2i");  // local net
const program = new anchor.Program(idl, programId, provider)

const TAKER_FEE = 0.0022;

module.exports = Object.freeze({
    provider,
    DEX_PID,
    TAKER_FEE,
    program
});
