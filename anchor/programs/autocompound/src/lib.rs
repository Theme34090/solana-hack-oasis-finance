// fn main() {
//     println!("Hello, world!");
// }
use anchor_lang::prelude::*;
use swap::{Swap, MarketAccounts, Side};
use anchor_spl::token::{TokenAccount};
// use raydium_test::VaultAccount;


#[program]
pub mod autocompound {
    use super::*;

    pub fn autocompound <'info>(
        ctx: Context<AutoCompound>,
    ) -> ProgramResult {
        msg!("init autocompound");
        // calculate before balance
        // let before_balance = ctx.accounts.vault_reward_token_account.amount;
        // msg!("before balance: {}", before_balance);
        // deposit 0 to claim rewards
        
        // calculate after balance and compute diff (claimed reward)

        // TODO: 
        // swap half of claimed reward to another pair
        // swapAmount, minExpectedSwapAmount
        let swapAmount = 2000000;
        let minExpectedSwapAmount = 1000000;
        msg!("loading swap program");
        let swap_cpi_program = ctx.accounts.swap_program.clone();
        msg!("swap program do exists!");
        let swap_cpi_accounts = Swap {
            market: MarketAccounts {  // expect swap::MarketAccount
                market: ctx.accounts.market.clone(),
                open_orders: ctx.accounts.open_orders.clone(),
                request_queue: ctx.accounts.request_queue.clone(),
                event_queue: ctx.accounts.event_queue.clone(),
                bids: ctx.accounts.bids.clone(),
                asks: ctx.accounts.asks.clone(),
                order_payer_token_account: ctx.accounts.order_payer_token_account.clone(),
                coin_vault: ctx.accounts.coin_vault.clone(),
                pc_vault: ctx.accounts.pc_vault.clone(),
                vault_signer: ctx.accounts.vault_signer.clone(),
                coin_wallet: ctx.accounts.coin_wallet.clone(),
            },
            authority: ctx.accounts.authority.clone(),
            pc_wallet: ctx.accounts.pc_wallet.clone(),
            dex_program: ctx.accounts.dex_program.clone(),
            token_program: ctx.accounts.token_program.clone(),
            rent: ctx.accounts.rent.clone(),
        };
        let swap_cpi_ctx = CpiContext::new(swap_cpi_program, swap_cpi_accounts);
        swap::cpi::swap(swap_cpi_ctx, Side::Ask, swapAmount, minExpectedSwapAmount);
        // let swap_cpi_ctx = CpiContext::new(

        //     ctx.accounts.swap.clone());
        // swap::cpi:swap(
        //     swap_cpi_ctx, 
        //     Side::Ask, // use Ask for sell
        //     swapAmount,  // FIXME:
        //     minExpectedSwapAmount // FIXME:
        // );
        // add to liquidity

        // provide liquidity
        Ok(())
    }
}

#[derive(Accounts)]
pub struct AutoCompound<'info> {
    // #[account(mut)]
    // pub vault_reward_token_account: CpiAccount<'info, TokenAccount>,
    ////// SWAP PROGRAM //////
    #[account(mut)]
    pub swap_program: AccountInfo<'info>,
    // swap accounts :: market
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
    #[account(mut)]
    pub order_payer_token_account: AccountInfo<'info>,
    #[account(mut)]
    pub coin_vault: AccountInfo<'info>,
    #[account(mut)]
    pub pc_vault: AccountInfo<'info>,
    pub vault_signer: AccountInfo<'info>,
    #[account(mut)]
    pub coin_wallet: AccountInfo<'info>,
    //swap accounts :: other
    #[account(signer)]
    pub authority: AccountInfo<'info>,
    #[account(mut)]
    pub pc_wallet: AccountInfo<'info>,
    // Programs.
    pub dex_program: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    // Sysvars.
    pub rent: AccountInfo<'info>,
    ////// VAULT PROGRAM //////
}


