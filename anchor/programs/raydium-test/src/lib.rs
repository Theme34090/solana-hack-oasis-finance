use anchor_lang::prelude::borsh::{BorshDeserialize, BorshSerialize};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::{invoke, invoke_signed};
// use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Burn, Mint, MintTo, TokenAccount, Transfer};

#[program]
pub mod raydium_test {
    use super::*;
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> ProgramResult {
        msg!("init");
        let signer = &ctx.accounts.user_owner.key;
        let accounts = [
            ctx.accounts.raydium_pool_id.clone(),
            ctx.accounts.raydium_pool_authority.clone(),
            ctx.accounts.user_info_account.clone(),
            ctx.accounts.user_owner.clone(),
            ctx.accounts.user_lp_token_account.to_account_info(),
            ctx.accounts.raydium_lp_token_account.to_account_info(),
            ctx.accounts.user_reward_token_account.to_account_info(),
            ctx.accounts.raydium_reward_token_account.to_account_info(),
            ctx.accounts.clock.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.user_reward_token_account_b.to_account_info(),
            ctx.accounts
                .raydium_reward_token_account_b
                .to_account_info(),
        ];
        msg!("1");
        let account_metas = accounts
            .iter()
            .map(|acc| {
                if acc.key == *signer {
                    AccountMeta::new(*acc.key, true)
                } else if acc.key == ctx.accounts.clock.to_account_info().key {
                    AccountMeta::new_readonly(*acc.key, false)
                } else {
                    AccountMeta::new(*acc.key, false)
                }
            })
            .collect::<Vec<_>>();
        msg!("{:?}", account_metas);
        msg!("2");
        let ix = Instruction::new_with_borsh(
            *ctx.accounts.raydium_program.key,
            &Data {
                instruction: 1,
                amount,
            },
            account_metas,
        );
        msg!("3");
        invoke(&ix, &accounts)?;
        msg!("4");
        Ok(())
    }
}

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct Data {
    pub instruction: u8,
    pub amount: u64,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    // user
    #[account(mut)]
    pub user_info_account: AccountInfo<'info>,
    #[account(mut, signer)]
    pub user_owner: AccountInfo<'info>,
    #[account(mut)]
    pub user_lp_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_reward_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_reward_token_account_b: CpiAccount<'info, TokenAccount>,
    // raydium
    pub raydium_program: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_pool_id: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_pool_authority: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_lp_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub raydium_reward_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub raydium_reward_token_account_b: CpiAccount<'info, TokenAccount>,
    #[account(mut, "token_program.key == &token::ID")]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}
