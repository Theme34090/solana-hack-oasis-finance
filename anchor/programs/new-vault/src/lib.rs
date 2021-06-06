use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Burn, Mint, MintTo, TokenAccount, Transfer};

#[program]
pub mod new_vault {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, nonce: u8) -> ProgramResult {
        msg!("init");
        let vault_account = &mut ctx.accounts.vault_account;
        vault_account.vault_token_mint = *ctx.accounts.vault_token_mint.to_account_info().key;
        vault_account.vault_lp_token_account =
            *ctx.accounts.vault_lp_token_account.to_account_info().key;
        vault_account.vault_reward_token_account = *ctx
            .accounts
            .vault_reward_token_account
            .to_account_info()
            .key;
        vault_account.vault_reward_token_account_b = *ctx
            .accounts
            .vault_reward_token_account_b
            .to_account_info()
            .key;
        vault_account.vault_raydium_user_info_account = *ctx
            .accounts
            .vault_raydium_user_info_account
            .to_account_info()
            .key;
        vault_account.nonce = nonce;

        msg!("1");
        let seeds = &[
            ctx.accounts.vault_account.to_account_info().key.as_ref(),
            &[ctx.accounts.vault_account.nonce],
        ];
        let signer = &[&seeds[..]];
        msg!("{:?}", ctx.accounts.vault_account.to_account_info());
        msg!(
            "{:?}",
            ctx.accounts
                .vault_raydium_user_info_account
                .to_account_info()
        );
        msg!("{:?}", ctx.accounts.token_program.to_account_info());
        msg!("{:?}", ctx.accounts.clock.to_account_info());
        let cpi_accounts = RaydiumDeposit {
            pool_id: ctx.accounts.raydium_pool_id.clone(),
            pool_authority: ctx.accounts.raydium_pool_authority.clone(),
            user_info_account: ctx.accounts.vault_raydium_user_info_account.clone(),
            user_owner: ctx.accounts.vault_account.to_account_info().clone(),
            user_lp_token_account: ctx.accounts.vault_lp_token_account.clone(),
            pool_lp_token_account: ctx.accounts.raydium_lp_token_account.clone(),
            user_reward_token_account: ctx.accounts.vault_reward_token_account.clone(),
            pool_reward_token_account: ctx.accounts.raydium_reward_token_account.clone(),
            clock: ctx.accounts.clock.clone(),
            token_program: ctx.accounts.token_program.clone(),
            user_reward_token_account_b: ctx.accounts.vault_reward_token_account_b.clone(),
            pool_reward_token_account_b: ctx.accounts.raydium_reward_token_account_b.clone(),
        };
        msg!("2");
        let cpi_program = ctx.accounts.raydium_program.clone();
        msg!("3");
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        msg!("4");
        raydium::deposit(cpi_ctx, 0);
        msg!("ok");
        Ok(())
    }
}

#[interface]
pub trait Raydium<'info, T: Accounts<'info>> {
    fn deposit(ctx: Context<T>, amount: u64) -> ProgramResult;
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // vault
    #[account(init)]
    pub vault_account: ProgramAccount<'info, VaultAccount>,
    pub vault_signer: AccountInfo<'info>,
    #[account(
        "vault_token_mint.mint_authority == COption::Some(*vault_signer.key)",
        "vault_token_mint.supply == 0"
    )]
    pub vault_token_mint: CpiAccount<'info, Mint>,
    #[account(mut, "vault_lp_token_account.owner == *vault_signer.key")]
    pub vault_lp_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_reward_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_reward_token_account_b: CpiAccount<'info, TokenAccount>,
    #[account(init)]
    pub vault_raydium_user_info_account: ProgramAccount<'info, RaydiumUserInfoAccount>,
    pub rent: Sysvar<'info, Rent>,
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

#[derive(Accounts)]
pub struct RaydiumDeposit<'info> {
    #[account(mut)]
    pub pool_id: AccountInfo<'info>,
    #[account(mut)]
    pub pool_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user_info_account: ProgramAccount<'info, RaydiumUserInfoAccount>,
    #[account(mut, signer)]
    pub user_owner: AccountInfo<'info>,
    #[account(mut)]
    pub user_lp_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub pool_lp_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_reward_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub pool_reward_token_account: CpiAccount<'info, TokenAccount>,
    pub clock: Sysvar<'info, Clock>,
    #[account("token_program.key == &token::ID")]
    pub token_program: AccountInfo<'info>,
    #[account(mut)]
    pub user_reward_token_account_b: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub pool_reward_token_account_b: CpiAccount<'info, TokenAccount>,
}

#[account]
pub struct VaultAccount {
    // vault
    pub vault_token_mint: Pubkey,
    pub vault_lp_token_account: Pubkey,
    pub vault_reward_token_account: Pubkey,
    pub vault_reward_token_account_b: Pubkey,
    pub vault_raydium_user_info_account: Pubkey,
    pub nonce: u8,
    // raydium
    // pub raydium_program: Pubkey,
    // pub raydium_pool_id: Pubkey,
    // pub raydium_pool_authority: Pubkey,
    // pub raydium_user_info: Pubkey,
    // pub raydium_lp_token_account: Pubkey,
    // pub raydium_reward_token_account: Pubkey,
    // pub raydium_reward_token_account_b: Pubkey,
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
