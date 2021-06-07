use anchor_lang::prelude::borsh::{BorshDeserialize, BorshSerialize};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::{invoke, invoke_signed};
// use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Burn, Mint, MintTo, TokenAccount, Transfer};

#[program]
pub mod raydium_test {
    use super::*;
    // pub fn initialize_vault(ctx: Context<InitializeVault>) -> ProgramResult {}

    pub fn deposit(ctx: Context<RaydiumDeposit>, amount: u64) -> ProgramResult {
        msg!("deposit");
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
        let ix = Instruction::new_with_borsh(
            *ctx.accounts.raydium_program.key,
            &DepositData {
                instruction: 1,
                amount,
            },
            account_metas,
        );
        msg!("invoking raydium");
        invoke(&ix, &accounts)?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<RaydiumWithdraw>, amount: u64) -> ProgramResult {
        msg!("withdraw");
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
        let ix = Instruction::new_with_borsh(
            *ctx.accounts.raydium_program.key,
            &WithdrawData {
                instruction: 2,
                amount,
            },
            account_metas,
        );
        msg!("invoking raydium");
        invoke(&ix, &accounts)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RaydiumWithdraw<'info> {
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

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct WithdrawData {
    pub instruction: u8,
    pub amount: u64,
}

// #[derive(Accounts)]
// pub struct InitializeVault<'info> {
//     // vault
//     #[account(init)]
//     pub vault_account: ProgramAccount<'info, VaultAccount>,
//     // pub vault_raydium_user_info_account:
// }

// #[account]
// pub struct VaultAccount {
//     pub nonce: u64,
// }

// #[account]
// pub struct RaydiumUserInfoAccount {
//     pub state: u64,
//     pub pool_id: Pubkey,
//     pub staker_owner: Pubkey,
//     pub deposit_balance: u64,
//     pub reward_debt: u64,
//     pub reward_debt_b: u64,
// }

#[derive(Accounts)]
pub struct RaydiumDeposit<'info> {
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

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct DepositData {
    pub instruction: u8,
    pub amount: u64,
}
