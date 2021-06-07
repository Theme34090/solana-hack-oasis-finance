use anchor_lang::prelude::borsh::{BorshDeserialize, BorshSerialize};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Burn, Mint, MintTo, TokenAccount, Transfer};

#[program]
pub mod new_vault {
    use super::*;
    pub fn initialize_vault(ctx: Context<InitializeVault>, nonce: u8) -> ProgramResult {
        msg!("initialize");
        let vault_account = &mut ctx.accounts.vault_account;

        vault_account.nonce = nonce;
        vault_account.vault_token_mint_address =
            *ctx.accounts.vault_token_mint_address.to_account_info().key;
        vault_account.vault_user_info_account = *ctx.accounts.vault_user_info_account.key;

        let seeds = &[
            ctx.accounts.vault_account.to_account_info().key.as_ref(),
            &[ctx.accounts.vault_account.nonce],
        ];
        let signer = &[&seeds[..]];
        let accounts = [
            ctx.accounts.raydium_pool_id.clone(),
            ctx.accounts.raydium_pool_authority.clone(),
            ctx.accounts.vault_user_info_account.clone(),
            ctx.accounts.vault_signer.clone(),
            ctx.accounts.vault_lp_token_account.to_account_info(),
            ctx.accounts.raydium_lp_token_account.to_account_info(),
            ctx.accounts.vault_reward_token_account.to_account_info(),
            ctx.accounts.raydium_reward_token_account.to_account_info(),
            ctx.accounts.clock.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.vault_reward_token_account_b.to_account_info(),
            ctx.accounts
                .raydium_reward_token_account_b
                .to_account_info(),
        ];
        let account_metas = accounts
            .iter()
            .map(|acc| {
                if acc.key == ctx.accounts.vault_signer.key {
                    AccountMeta::new_readonly(*acc.key, true)
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
                amount: 0,
            },
            account_metas,
        );
        msg!("invoking raydium");
        invoke_signed(&ix, &accounts, signer)?;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> ProgramResult {
        msg!("deposit");
        let vault_account = &ctx.accounts.vault_account;

        // transfer user's LP to vault account
        msg!("transfer user lp to vault");
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_lp_token_account.to_account_info(),
            to: ctx.accounts.vault_lp_token_account.to_account_info(),
            authority: ctx.accounts.user_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // calculate mint amount
        // let current_deposit = vault_account.vault_user_info_account.
        // let mint_amount = if ctx.accounts.vault_lp_token_account.amount == 0 {
        //     amount
        // } else {
        //     amount * ctx.accounts.vault_token_mint_address.supply / ctx.accounts.vault_lp_token_account.amount
        // };

        // mint vault tokens to user's vault account
        msg!("mint vault token to user");
        let seeds = &[
            ctx.accounts.vault_account.to_account_info().key.as_ref(),
            &[vault_account.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = MintTo {
            mint: ctx.accounts.vault_token_mint_address.to_account_info(),
            to: ctx.accounts.user_vault_token_account.to_account_info(),
            authority: ctx.accounts.vault_signer.clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        // change mint amount duay
        token::mint_to(cpi_ctx, amount)?;

        // deposit raydium
        msg!("deposit raydium");
        let accounts = [
            ctx.accounts.raydium_pool_id.clone(),
            ctx.accounts.raydium_pool_authority.clone(),
            ctx.accounts.vault_user_info_account.clone(),
            ctx.accounts.vault_signer.clone(),
            ctx.accounts.vault_lp_token_account.to_account_info(),
            ctx.accounts.raydium_lp_token_account.to_account_info(),
            ctx.accounts.vault_reward_token_account.to_account_info(),
            ctx.accounts.raydium_reward_token_account.to_account_info(),
            ctx.accounts.clock.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.vault_reward_token_account_b.to_account_info(),
            ctx.accounts
                .raydium_reward_token_account_b
                .to_account_info(),
        ];
        let account_metas = accounts
            .iter()
            .map(|acc| {
                if acc.key == ctx.accounts.vault_signer.key {
                    AccountMeta::new_readonly(*acc.key, true)
                } else if acc.key == ctx.accounts.clock.to_account_info().key {
                    AccountMeta::new_readonly(*acc.key, false)
                } else {
                    AccountMeta::new(*acc.key, false)
                }
            })
            .collect::<Vec<_>>();
        let seeds = &[
            ctx.accounts.vault_account.to_account_info().key.as_ref(),
            &[ctx.accounts.vault_account.nonce],
        ];
        let signer = &[&seeds[..]];
        let ix = Instruction::new_with_borsh(
            *ctx.accounts.raydium_program.key,
            &DepositData {
                instruction: 1,
                amount,
            },
            account_metas,
        );
        msg!("invoking raydium");
        invoke_signed(&ix, &accounts, signer)?;
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
pub struct InitializeVault<'info> {
    // vault
    #[account(init)]
    pub vault_account: ProgramAccount<'info, VaultAccount>,
    pub vault_signer: AccountInfo<'info>,
    #[account(
        "vault_token_mint_address.mint_authority == COption::Some(*vault_signer.key)",
        "vault_token_mint_address.supply == 0"
    )]
    pub vault_token_mint_address: CpiAccount<'info, Mint>,
    #[account(mut)]
    pub vault_user_info_account: AccountInfo<'info>,
    #[account(mut)]
    pub vault_lp_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_reward_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_reward_token_account_b: CpiAccount<'info, TokenAccount>,
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
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct VaultAccount {
    // vault
    pub nonce: u8,
    pub vault_token_mint_address: Pubkey,
    pub vault_user_info_account: Pubkey,
    // // raydium
    // pub raydium_program: Pubkey,
    // pub raydium_pool_id: Pubkey,
    // pub raydium_pool_authority: Pubkey,
    // pub raydium_lp_token_account: Pubkey,
    // pub raydium_reward_token_account: Pubkey,
    // pub raydium_reward_token_account_b: Pubkey,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    // vault
    pub vault_account: ProgramAccount<'info, VaultAccount>,
    #[account(seeds = [vault_account.to_account_info().key.as_ref(), &[vault_account.nonce]])]
    pub vault_signer: AccountInfo<'info>,
    #[account(
        mut,
        "vault_token_mint_address.mint_authority == COption::Some(*vault_signer.key)",
        "vault_account.vault_token_mint_address == *vault_token_mint_address.to_account_info().key"
    )]
    pub vault_token_mint_address: CpiAccount<'info, Mint>,
    #[account(mut)]
    pub vault_user_info_account: AccountInfo<'info>,
    #[account(mut)]
    pub vault_lp_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_reward_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_reward_token_account_b: CpiAccount<'info, TokenAccount>,
    //user
    #[account(mut, signer)]
    pub user_signer: AccountInfo<'info>,
    #[account(mut, "user_lp_token_account.owner == *user_signer.key")]
    pub user_lp_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut, "user_vault_token_account.owner == *user_signer.key")]
    pub user_vault_token_account: CpiAccount<'info, TokenAccount>,
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

#[account]
pub struct RaydiumUserInfoAccount {
    pub state: u64,
    pub pool_id: Pubkey,
    pub staker_owner: Pubkey,
    pub deposit_balance: u64,
    pub reward_debt: u64,
    pub reward_debt_b: u64,
}
