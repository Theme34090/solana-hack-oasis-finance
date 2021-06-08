# Oasis Finance

Auto compound on Solana blockchain with Raydium staking integration

**Devnet program id**: 2QGo9WwyXbFzyCnrob9XuLbEwqxmNhn4a58w4BxZBer5
**Client url**: https://solana-hack-oasis-finance.vercel.app/

## How to run

### Client

```sh
yarn install
yarn start
```

### Program

config to use devnet

```
anchor build
solana deploy <your-path-to-file.so>
```

copy your program id into PROGRAM_ID constant in tests/newVault.js

```
anchor test --skip-build --skip-deploy
```

## Program detail

For each vault will have their own vault token which represents user's share in vault. The program then mint vault token to user with amount that is proportionate to user's deposit. User can redeem their stake with vault token.

There are 4 instructions

1. initialize_vault
    - creating new vault for user to farm
    - call raydium deposit with 0 amount to check if pair exists
2. deposit
    - transfer user's LP token to vault LP account
    - mint vault token to user
    - call raydium deposit with our LP account
3. withdraw
    - calculate how much LP user will get back from given vault token amount
    - burn vault token
    - call raydium withdraw (withdraw into program account) with amount calculated from step 1
    - transfer LP back to user
4. compound
    - call harvest raydium
    - calculate amount we have to sell to get 50/50 ratio for providing liquidity
    - call swap on serum
    - call add liquidity raydium
    - call deposit raydium
