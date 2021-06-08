//! Program to perform instantly settled token swaps on the Serum DEX.
//!
//! Before using any instruction here, a user must first create an open orders
//! account on all markets being used. This only needs to be done once. As a
//! convention established by the DEX, this should be done via the system
//! program create account instruction in the same transaction as the user's
//! first trade. Then, the DEX will lazily initialize the open orders account.

use anchor_lang::prelude::*;
use anchor_spl::dex;
use anchor_spl::dex::serum_dex::instruction::SelfTradeBehavior;
use anchor_spl::dex::serum_dex::matching::{OrderType, Side as SerumSide};
use anchor_spl::dex::serum_dex::state::MarketState;
use anchor_spl::token;
use std::num::NonZeroU64;

use solana_program::pubkey::{Pubkey};
pub use solana_program;
pub use serum_dex;

#[program]
pub mod swap {
    use super::*;

    /// Swaps two tokens on a single A/B market, where A is the base currency
    /// and B is the quote currency. This is just a direct IOC trade that
    /// instantly settles.
    ///
    /// When side is "bid", then swaps B for A. When side is "ask", then swaps
    /// A for B.
    ///
    /// Arguments:
    ///
    /// * `side`                     - The direction to swap.
    /// * `amount`                   - The amount to swap *from*
    /// * `min_expected_swap_amount` - The minimum amount of the *to* token the
    ///    client expects to receive from the swap. The instruction fails if
    ///    execution would result in less.
    #[access_control(is_valid_swap(&ctx))]
    pub fn swap<'info>(
        ctx: Context<'_, '_, '_, 'info, Swap<'info>>,
        side: Side,
        amount: u64,
        min_expected_swap_amount: u64,
    ) -> Result<()> {
        // Optional referral account (earns a referral fee).
        let referral = ctx.remaining_accounts.iter().next().map(Clone::clone);

        // Side determines swap direction.
        let (from_token, to_token) = match side {
            Side::Bid => (&ctx.accounts.pc_wallet, &ctx.accounts.market.coin_wallet),
            Side::Ask => (&ctx.accounts.market.coin_wallet, &ctx.accounts.pc_wallet),
        };
        msg!("Side determines swap direction");

        // Token balances before the trade.
        let from_amount_before = token::accessor::amount(from_token)?;
        let to_amount_before = token::accessor::amount(to_token)?;
        msg!("Token balances before the trade.");
        // Execute trade.
        let orderbook: OrderbookClient<'info> = (&*ctx.accounts).into();
        msg!("1");
        match side {
            Side::Bid => orderbook.buy(amount, referral.clone(), &ctx.accounts.dex_program)?,
            Side::Ask => orderbook.sell(amount, referral.clone(), &ctx.accounts.dex_program)?,
        };
        msg!("2");
        orderbook.settle(referral, &ctx.accounts.dex_program)?;
        msg!("Execute trade.");

        // Token balances after the trade.
        let from_amount_after = token::accessor::amount(from_token)?;
        let to_amount_after = token::accessor::amount(to_token)?;
        msg!("Token balances after the trade.");

        //  Calculate the delta, i.e. the amount swapped.
        let from_amount = from_amount_before.checked_sub(from_amount_after).unwrap();
        let to_amount = to_amount_after.checked_sub(to_amount_before).unwrap();
        msg!("Calculate the delta, i.e. the amount swapped.");

        // Safety checks.
        apply_risk_checks(DidSwap {
            authority: *ctx.accounts.authority.key,
            given_amount: amount,
            min_expected_swap_amount,
            from_amount,
            to_amount,
            spill_amount: 0,
            from_mint: token::accessor::mint(from_token)?,
            to_mint: token::accessor::mint(to_token)?,
            quote_mint: match side {
                Side::Bid => token::accessor::mint(from_token)?,
                Side::Ask => token::accessor::mint(to_token)?,
            },
        })?;
        msg!("Safety checks.");

        Ok(())
    }

}

// Asserts the swap event is valid.
fn apply_risk_checks(event: DidSwap) -> Result<()> {
    // Reject if the resulting amount is less than the client's expectation.
    if event.to_amount < event.min_expected_swap_amount {
        return Err(ErrorCode::SlippageExceeded.into());
    }
    emit!(event);
    Ok(())
}

// The only constraint imposed on these accounts is that the market's base
// currency mint is not equal to the quote currency's. All other checks are
// done by the DEX on CPI.
#[derive(Accounts)]
pub struct Swap<'info> {
    pub market: MarketAccounts<'info>,
    #[account(signer)]
    pub authority: AccountInfo<'info>,
    #[account(mut)]
    pub pc_wallet: AccountInfo<'info>,
    // Programs.
    pub dex_program: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    // Sysvars.
    pub rent: AccountInfo<'info>,
}

impl<'info> From<&Swap<'info>> for OrderbookClient<'info> {
    fn from(accounts: &Swap<'info>) -> OrderbookClient<'info> {
        OrderbookClient {
            market: accounts.market.clone(),
            authority: accounts.authority.clone(),
            pc_wallet: accounts.pc_wallet.clone(),
            dex_program: accounts.dex_program.clone(),
            token_program: accounts.token_program.clone(),
            rent: accounts.rent.clone(),
        }
    }
}

// Client for sending orders to the Serum DEX.
struct OrderbookClient<'info> {
    market: MarketAccounts<'info>,
    authority: AccountInfo<'info>,
    pc_wallet: AccountInfo<'info>,
    dex_program: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    rent: AccountInfo<'info>,
}

impl<'info> OrderbookClient<'info> {
    // Executes the sell order portion of the swap, purchasing as much of the
    // quote currency as possible for the given `base_amount`.
    //
    // `base_amount` is the "native" amount of the base currency, i.e., token
    // amount including decimals.
    fn sell(&self, base_amount: u64, referral: Option<AccountInfo<'info>>, dexPID: &AccountInfo<'info>) -> ProgramResult {
        msg!("sell");
        let limit_price = 1;
        // msg!("Base_amount: {:?}", base_amount);
        let max_coin_qty = {
            // The loaded market must be dropped before CPI.
            let market = MarketState::load(&self.market.market, &*dexPID.key)?;
            // msg!("Market: {:?}", market);
            // msg!("Market coin lot size {:?}", market.coin_lot_size);
            // let coin_lots_return = coin_lots(&market, base_amount);
            let coin_lots_return = base_amount.checked_div(market.coin_lot_size).unwrap();
            // msg!("Coinlots return value: {:?}", coin_lots_return);
            coin_lots_return
        };
        // msg!("Logging max_coin_qty before: {:?}", max_coin_qty);
        let max_native_pc_qty = u64::MAX;
        msg!("Calling order_cpi in sell");
        self.order_cpi(
            limit_price,
            max_coin_qty,
            max_native_pc_qty,
            Side::Ask,
            referral,
            &dexPID
        )
    }

    // Executes the buy order portion of the swap, purchasing as much of the
    // base currency as possible, for the given `quote_amount`.
    //
    // `quote_amount` is the "native" amount of the quote currency, i.e., token
    // amount including decimals.
    fn buy(&self, quote_amount: u64, referral: Option<AccountInfo<'info>>, dexPID: &AccountInfo<'info>) -> ProgramResult {
        msg!("buy");
        let limit_price = u64::MAX;
        let max_coin_qty = u64::MAX;
        let max_native_pc_qty = quote_amount;
        msg!("buy before function");
        self.order_cpi(
            limit_price,
            max_coin_qty,
            max_native_pc_qty,
            Side::Bid,
            referral,
            &dexPID
        )
    }

    // Executes a new order on the serum dex via CPI.
    //
    // * `limit_price` - the limit order price in lot units.
    // * `max_coin_qty`- the max number of the base currency lot units.
    // * `max_native_pc_qty` - the max number of quote currency in native token
    //                         units (includes decimals).
    // * `side` - bid or ask, i.e. the type of order.
    // * `referral` - referral account, earning a fee.
    fn order_cpi(
        &self,
        limit_price: u64,
        max_coin_qty: u64,
        max_native_pc_qty: u64,
        side: Side,
        referral: Option<AccountInfo<'info>>,
        dexPID: &AccountInfo<'info>
    ) -> ProgramResult {
        // Client order id is only used for cancels. Not used here so hardcode.
        let client_order_id = 0;
        // Limit is the dex's custom compute budge parameter, setting an upper
        // bound on the number of matching cycles the program can perform
        // before giving up and posting the remaining unmatched order.
        let limit = 65535;

        let dex_accs = dex::NewOrderV3 {
            market: self.market.market.clone(),
            open_orders: self.market.open_orders.clone(),
            request_queue: self.market.request_queue.clone(),
            event_queue: self.market.event_queue.clone(),
            market_bids: self.market.bids.clone(),
            market_asks: self.market.asks.clone(),
            order_payer_token_account: self.market.order_payer_token_account.clone(),
            open_orders_authority: self.authority.clone(),
            coin_vault: self.market.coin_vault.clone(),
            pc_vault: self.market.pc_vault.clone(),
            token_program: self.token_program.clone(),
            rent: self.rent.clone(),
        };
        // let mut ctx = CpiContext::new(self.dex_program.clone(), dex_accs);
        let mut ctx = CpiContext::new(dexPID.clone(), dex_accs);
        if let Some(referral) = referral {
            ctx = ctx.with_remaining_accounts(vec![referral]);
        }
        msg!("Calling new_order_v3");
        let use_side = match side {
            Side::Bid => serum_dex::matching::Side::Bid,
            Side::Ask => serum_dex::matching::Side::Ask,
        };

        let referral_accs = ctx.remaining_accounts.iter().next();
        
        let ix = serum_dex::instruction::new_order(
            ctx.accounts.market.key,
            ctx.accounts.open_orders.key,
            ctx.accounts.request_queue.key,
            ctx.accounts.event_queue.key,
            ctx.accounts.market_bids.key,
            ctx.accounts.market_asks.key,
            ctx.accounts.order_payer_token_account.key,
            ctx.accounts.open_orders_authority.key,
            ctx.accounts.coin_vault.key,
            ctx.accounts.pc_vault.key,
            ctx.accounts.token_program.key,
            ctx.accounts.rent.key,
            referral_accs.map(|r| r.key),
            &*dexPID.key,
            use_side,
            NonZeroU64::new(limit_price).unwrap(),
            NonZeroU64::new(max_coin_qty).unwrap(),
            OrderType::ImmediateOrCancel,
            client_order_id,
            SelfTradeBehavior::DecrementTake,
            limit,
            NonZeroU64::new(max_native_pc_qty).unwrap(),
        )?;
        msg!("Swap order ix created");
        solana_program::program::invoke_signed(
            &ix,
            &ToAccountInfos::to_account_infos(&ctx),
            ctx.signer_seeds,
        )?;
        msg!("Invoked signed!");
        Ok(())

        // dex::new_order_v3(
        //     ctx,
        //     side.into(),
        //     NonZeroU64::new(limit_price).unwrap(),
        //     NonZeroU64::new(max_coin_qty).unwrap(),
        //     NonZeroU64::new(max_native_pc_qty).unwrap(),
        //     SelfTradeBehavior::DecrementTake,
        //     OrderType::ImmediateOrCancel,
        //     client_order_id,
        //     limit,
        // )
    }

    fn settle(&self, referral: Option<AccountInfo<'info>>, dexPID: &AccountInfo<'info>) -> ProgramResult {
        let settle_accs = dex::SettleFunds {
            market: self.market.market.clone(),
            open_orders: self.market.open_orders.clone(),
            open_orders_authority: self.authority.clone(),
            coin_vault: self.market.coin_vault.clone(),
            pc_vault: self.market.pc_vault.clone(),
            coin_wallet: self.market.coin_wallet.clone(),
            pc_wallet: self.pc_wallet.clone(),
            vault_signer: self.market.vault_signer.clone(),
            token_program: self.token_program.clone(),
        };
        let mut ctx = CpiContext::new(self.dex_program.clone(), settle_accs);
        if let Some(referral) = referral {
            ctx = ctx.with_remaining_accounts(vec![referral]);
        }
        // dex::settle_funds(ctx)
        let referral = ctx.remaining_accounts.iter().next();
        let ix = serum_dex::instruction::settle_funds(
            &*dexPID.key,
            ctx.accounts.market.key,
            ctx.accounts.token_program.key,
            ctx.accounts.open_orders.key,
            ctx.accounts.open_orders_authority.key,
            ctx.accounts.coin_vault.key,
            ctx.accounts.coin_wallet.key,
            ctx.accounts.pc_vault.key,
            ctx.accounts.pc_wallet.key,
            referral.map(|r| r.key),
            ctx.accounts.vault_signer.key,
        )?;
        solana_program::program::invoke_signed(
            &ix,
            &ToAccountInfos::to_account_infos(&ctx),
            ctx.signer_seeds,
        )?;
        Ok(())
    }
}

// Returns the amount of lots for the base currency of a trade with `size`.
fn coin_lots(market: &MarketState, size: u64) -> u64 {
    size.checked_div(market.coin_lot_size).unwrap()
}

// Market accounts are the accounts used to place orders against the dex minus
// common accounts, i.e., program ids, sysvars, and the `pc_wallet`.
#[derive(Accounts, Clone)]
pub struct MarketAccounts<'info> {
    #[account(mut)]
    pub market: AccountInfo<'info>,
    #[account(mut)]
    pub open_orders: AccountInfo<'info>,
    #[account(mut)]
    pub request_queue: AccountInfo<'info>,
    #[account(mut)]
    pub event_queue: AccountInfo<'info>,
    #[account(mut)]
    pub bids: AccountInfo<'info>,
    #[account(mut)]
    pub asks: AccountInfo<'info>,
    // The `spl_token::Account` that funds will be taken from, i.e., transferred
    // from the user into the market's vault.
    //
    // For bids, this is the base currency. For asks, the quote.
    #[account(mut)]
    pub order_payer_token_account: AccountInfo<'info>,
    // Also known as the "base" currency. For a given A/B market,
    // this is the vault for the A mint.
    #[account(mut)]
    pub coin_vault: AccountInfo<'info>,
    // Also known as the "quote" currency. For a given A/B market,
    // this is the vault for the B mint.
    #[account(mut)]
    pub pc_vault: AccountInfo<'info>,
    // PDA owner of the DEX's token accounts for base + quote currencies.
    pub vault_signer: AccountInfo<'info>,
    // User wallets.
    #[account(mut)]
    pub coin_wallet: AccountInfo<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum Side {
    Bid,
    Ask,
}

impl From<Side> for SerumSide {
    fn from(side: Side) -> SerumSide {
        match side {
            Side::Bid => SerumSide::Bid,
            Side::Ask => SerumSide::Ask,
        }
    }
}

// Access control modifiers.

fn is_valid_swap(ctx: &Context<Swap>) -> Result<()> {
    _is_valid_swap(&ctx.accounts.market.coin_wallet, &ctx.accounts.pc_wallet)
}

// Validates the tokens being swapped are of different mints.
fn _is_valid_swap<'info>(from: &AccountInfo<'info>, to: &AccountInfo<'info>) -> Result<()> {
    let from_token_mint = token::accessor::mint(from)?;
    let to_token_mint = token::accessor::mint(to)?;
    if from_token_mint == to_token_mint {
        return Err(ErrorCode::SwapTokensCannotMatch.into());
    }
    Ok(())
}

// Event emitted when a swap occurs for two base currencies on two different
// markets (quoted in the same token).
#[event]
pub struct DidSwap {
    // User given (max) amount to swap.
    pub given_amount: u64,
    // The minimum amount of the *to* token expected to be received from
    // executing the swap.
    pub min_expected_swap_amount: u64,
    // Amount of the `from` token sold.
    pub from_amount: u64,
    // Amount of the `to` token purchased.
    pub to_amount: u64,
    // Amount of the quote currency accumulated from the swap.
    pub spill_amount: u64,
    // Mint sold.
    pub from_mint: Pubkey,
    // Mint purchased.
    pub to_mint: Pubkey,
    // Mint of the token used as the quote currency in the two markets used
    // for swapping.
    pub quote_mint: Pubkey,
    // User that signed the transaction.
    pub authority: Pubkey,
}

#[error]
pub enum ErrorCode {
    #[msg("The tokens being swapped must have different mints")]
    SwapTokensCannotMatch,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
}
