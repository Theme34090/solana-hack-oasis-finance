use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Burn, Mint, MintTo, TokenAccount, Transfer};

#[program]
pub mod vault {
    use super::*;
    // pub fn initialize(ctx: Context<InitializeVault>, nonce: u8) -> ProgramResult {
    //     let vault_account = &mut ctx.accounts.vault_account;
    //     vault_account.vault_token_mint = *ctx.accounts.vault_token_mint.to_account_info().key;
    //     vault_account.vault_farm_lp = *ctx.accounts.vault_farm_lp.to_account_info().key;
    //     vault_account.farm_lp_mint = *ctx.accounts.farm_lp_mint.to_account_info().key;
    //     vault_account.nonce = nonce;
    //     Ok(())
    // }

    // pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    //     if ctx.accounts.user_farm_lp.amount < amount {
    //         return Err(ErrorCode::InsufficientLPTokens.into());
    //     }
    //     let vault_account = &mut ctx.accounts.vault_account;
    //     if ctx.accounts.user_farm_lp.mint != vault_account.farm_lp_mint {
    //         return Err(ErrorCode::MismatchFarmLP.into());
    //     }
    //     if *ctx.accounts.vault_token_mint.to_account_info().key != vault_account.vault_token_mint {
    //         return Err(ErrorCode::MismatchVaultTokens.into());
    //     }

    //     // transfer user's farm LP to vault
    //     let cpi_accounts = Transfer {
    //         from: ctx.accounts.user_farm_lp.to_account_info(),
    //         to: ctx.accounts.vault_farm_lp.to_account_info(),
    //         authority: ctx.accounts.user_authority.clone(),
    //     };
    //     let cpi_program = ctx.accounts.token_program.to_account_info();
    //     let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    //     token::transfer(cpi_ctx, amount)?;

    //     // calculate mint amount
    //     let mint_amount = if ctx.accounts.vault_farm_lp.amount == 0 {
    //         amount
    //     } else {
    //         amount * ctx.accounts.vault_token_mint.supply / ctx.accounts.vault_farm_lp.amount
    //     };

    //     // mint vault tokens to user's vault account
    //     let seeds = &[
    //         ctx.accounts.vault_account.to_account_info().key.as_ref(),
    //         &[ctx.accounts.vault_account.nonce],
    //     ];
    //     let signer = &[&seeds[..]];
    //     let cpi_accounts = MintTo {
    //         mint: ctx.accounts.vault_token_mint.to_account_info(),
    //         to: ctx.accounts.user_vault_token.to_account_info(),
    //         authority: ctx.accounts.vault_signer.clone(),
    //     };
    //     let cpi_program = ctx.accounts.token_program.clone();
    //     let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    //     token::mint_to(cpi_ctx, mint_amount)?;

    //     Ok(())
    // }

    // pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    //     if ctx.accounts.user_vault_token.amount < amount {
    //         return Err(ErrorCode::InsufficientVaultTokens.into());
    //     }
    //     let vault_account = &mut ctx.accounts.vault_account;
    //     if ctx.accounts.user_farm_lp.mint != vault_account.farm_lp_mint {
    //         return Err(ErrorCode::MismatchFarmLP.into());
    //     }
    //     if *ctx.accounts.vault_token_mint.to_account_info().key != vault_account.vault_token_mint {
    //         return Err(ErrorCode::MismatchVaultTokens.into());
    //     }

    //     // calculate share amount
    //     // let amount_in_farm =
    //     // let share_amount = amount * amount_in_farm / ctx.accounts.vault_farm_lp.amount;

    //     // burn the user's vault tokens
    //     let cpi_accounts = Burn {
    //         mint: ctx.accounts.vault_token_mint.to_account_info(),
    //         to: ctx.accounts.user_vault_token.to_account_info(),
    //         authority: ctx.accounts.user_authority.to_account_info(),
    //     };
    //     let cpi_program = ctx.accounts.token_program.clone();
    //     let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    //     token::burn(cpi_ctx, amount)?;

    //     // transfer farm LP from vault's farm LP account to user
    //     let seeds = &[
    //         ctx.accounts.vault_account.to_account_info().key.as_ref(),
    //         &[ctx.accounts.vault_account.nonce],
    //     ];
    //     let signer = &[&seeds[..]];
    //     let cpi_accounts = Transfer {
    //         from: ctx.accounts.vault_farm_lp.to_account_info(),
    //         to: ctx.accounts.user_farm_lp.to_account_info(),
    //         authority: ctx.accounts.vault_signer.to_account_info(),
    //     };
    //     let cpi_program = ctx.accounts.token_program.clone();
    //     let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    //     token::transfer(cpi_ctx, amount)?;

    //     Ok(())
    // }

    pub fn farm(ctx: Context<Farm>, amount: u64) -> ProgramResult {
        let cpi_accounts = RaydiumDeposit {
            raydium_pool_id: ctx.accounts.raydium_pool_id.to_account_info(),
            raydium_authority: ctx.accounts.raydium_authority.to_account_info(),
            user_info_account: ctx.accounts.user_info_account.clone(),
            user_authority: ctx.accounts.user_authority.to_account_info(),
            user_lp_token_account: ctx.accounts.user_lp_token_account.clone(),
            raydium_lp_token_account: ctx.accounts.raydium_lp_token_account.clone(),
            user_reward_token_account: ctx.accounts.user_reward_token_account.clone(),
            raydium_reward_token_account: ctx.accounts.raydium_reward_token_account.clone(),
            token_program: ctx.accounts.token_program.to_account_info(),
            clock: ctx.accounts.clock.clone(),
        };
        let cpi_program = ctx.accounts.raydium_program.clone();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        raydium::deposit(cpi_ctx, amount);

        Ok(())
    }
    pub fn farmv4(ctx: Context<Farm>, amount: u64) -> ProgramResult {
        let cpi_accounts = RaydiumDeposit {
            raydium_pool_id: ctx.accounts.raydium_pool_id.to_account_info(),
            raydium_authority: ctx.accounts.raydium_authority.to_account_info(),
            user_info_account: ctx.accounts.user_info_account.clone(),
            user_authority: ctx.accounts.user_authority.to_account_info(),
            user_lp_token_account: ctx.accounts.user_lp_token_account.clone(),
            raydium_lp_token_account: ctx.accounts.raydium_lp_token_account.clone(),
            user_reward_token_account: ctx.accounts.user_reward_token_account.clone(),
            raydium_reward_token_account: ctx.accounts.raydium_reward_token_account.clone(),
            token_program: ctx.accounts.token_program.to_account_info(),
            clock: ctx.accounts.clock.clone(),
            user_reward_token_account_b: ctx.accounts.user_reward_token_account_b.clone(),
            raydium_reward_token_account_b: ctx.accounts.raydium_reward_token_account_b.clone(),
        };
        let cpi_program = ctx.accounts.raydium_program.clone();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        raydium::deposit(cpi_ctx, amount);

        Ok(())
    }
}

#[interface]
pub trait Raydium<'info, T: Accounts<'info>> {
    fn deposit(ctx: Context<T>, amount: u64) -> ProgramResult;
    fn depositv4(ctx: Context<T>, amount: u64) -> ProgramResult;
}

#[derive(Accounts)]
pub struct RaydiumDeposit<'info> {
    pub raydium_pool_id: AccountInfo<'info>,
    pub raydium_authority: AccountInfo<'info>,
    pub user_info_account: CpiAccount<'info, RaydiumUserInfoAccount>,
    pub user_authority: AccountInfo<'info>,
    pub user_lp_token_account: CpiAccount<'info, TokenAccount>,
    pub raydium_lp_token_account: CpiAccount<'info, TokenAccount>,
    pub user_reward_token_account: CpiAccount<'info, TokenAccount>,
    pub raydium_reward_token_account: CpiAccount<'info, TokenAccount>,
    #[account("token_program.key == &token::ID")]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct RaydiumDepositV4<'info> {
    pub raydium_pool_id: AccountInfo<'info>,
    pub raydium_authority: AccountInfo<'info>,
    pub user_info_account: CpiAccount<'info, RaydiumUserInfoAccount>,
    pub user_authority: AccountInfo<'info>,
    pub user_lp_token_account: CpiAccount<'info, TokenAccount>,
    pub raydium_lp_token_account: CpiAccount<'info, TokenAccount>,
    pub user_reward_token_account: CpiAccount<'info, TokenAccount>,
    pub raydium_reward_token_account: CpiAccount<'info, TokenAccount>,
    #[account("token_program.key == &token::ID")]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub user_reward_token_account_b: CpiAccount<'info, TokenAccount>,
    pub raydium_reward_token_account_b: CpiAccount<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct Farm<'info> {
    pub raydium_program: AccountInfo<'info>,
    pub raydium_pool_id: AccountInfo<'info>,
    pub raydium_authority: AccountInfo<'info>,
    pub user_info_account: CpiAccount<'info, RaydiumUserInfoAccount>,
    pub user_authority: AccountInfo<'info>,
    pub user_lp_token_account: CpiAccount<'info, TokenAccount>,
    pub raydium_lp_token_account: CpiAccount<'info, TokenAccount>,
    pub user_reward_token_account: CpiAccount<'info, TokenAccount>,
    pub raydium_reward_token_account: CpiAccount<'info, TokenAccount>,
    #[account("token_program.key == &token::ID")]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(init)]
    pub vault_account: ProgramAccount<'info, VaultAccount>,
    pub vault_signer: AccountInfo<'info>,
    #[account(
        "vault_token_mint.mint_authority == COption::Some(*vault_signer.key)",
        "vault_token_mint.supply == 0"
    )]
    pub vault_token_mint: CpiAccount<'info, Mint>,
    #[account(mut, "vault_farm_lp.owner == *vault_signer.key")]
    pub vault_farm_lp: CpiAccount<'info, TokenAccount>,
    pub farm_lp_mint: CpiAccount<'info, Mint>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(has_one = vault_token_mint, has_one = vault_farm_lp)]
    pub vault_account: ProgramAccount<'info, VaultAccount>,
    #[account(seeds = [vault_account.to_account_info().key.as_ref(), &[vault_account.nonce]])]
    vault_signer: AccountInfo<'info>,
    #[account(
        mut,
        "vault_token_mint.mint_authority == COption::Some(*vault_signer.key)"
    )]
    pub vault_token_mint: CpiAccount<'info, Mint>,
    #[account(mut, "vault_farm_lp.owner == *vault_signer.key")]
    pub vault_farm_lp: CpiAccount<'info, TokenAccount>,
    #[account(signer)]
    pub user_authority: AccountInfo<'info>,
    #[account(mut, "user_farm_lp.owner == *user_authority.key")]
    pub user_farm_lp: CpiAccount<'info, TokenAccount>,
    #[account(mut, "user_vault_token.owner == *user_authority.key")]
    pub user_vault_token: CpiAccount<'info, TokenAccount>,
    #[account("token_program.key == &token::ID")]
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(has_one = vault_token_mint, has_one = vault_farm_lp)]
    pub vault_account: ProgramAccount<'info, VaultAccount>,
    #[account(seeds = [vault_account.to_account_info().key.as_ref(), &[vault_account.nonce]])]
    vault_signer: AccountInfo<'info>,
    #[account(
        mut,
        "vault_token_mint.mint_authority == COption::Some(*vault_signer.key)"
    )]
    pub vault_token_mint: CpiAccount<'info, Mint>,
    #[account(mut, "vault_farm_lp.owner == *vault_signer.key")]
    pub vault_farm_lp: CpiAccount<'info, TokenAccount>,
    #[account(signer)]
    pub user_authority: AccountInfo<'info>,
    #[account(mut, "user_farm_lp.owner == *user_authority.key")]
    pub user_farm_lp: CpiAccount<'info, TokenAccount>,
    #[account(mut, "user_vault_token.owner == *user_authority.key")]
    pub user_vault_token: CpiAccount<'info, TokenAccount>,
    #[account("token_program.key == &token::ID")]
    pub token_program: AccountInfo<'info>,
}
#[account]
pub struct VaultAccount {
    pub vault_token_mint: Pubkey,
    pub vault_farm_lp: Pubkey,
    pub farm_lp_mint: Pubkey,
    pub vault_reward_token_account: Pubkey,
    pub nonce: u8,

    // raydium farm info
    pub raydium_farm_program_id: Pubkey,
    pub raydium_pool_id: Pubkey,
    pub raydium_pool_authority: Pubkey,
    pub raydium_user_info: Pubkey,
    pub raydium_lp_token_account: Pubkey,
    pub raydium_reward_token_account: Pubkey,
}

#[account]
pub struct RaydiumUserInfoAccount {
    pub state: u64,
    pub pool_id: Pubkey,
    pub staker_owner: Pubkey,
    pub deposit_balance: u64,
    pub reward_debt: u64,
}

#[account]
pub struct RaydiumUserInfoAccountV4 {
    pub state: u64,
    pub pool_id: Pubkey,
    pub staker_owner: Pubkey,
    pub deposit_balance: u64,
    pub reward_debt: u64,
    pub reward_debt_b: u64,
}

#[error]
pub enum ErrorCode {
    #[msg("Insufficient LP tokens")]
    InsufficientLPTokens,
    #[msg("Insufficient vault tokens")]
    InsufficientVaultTokens,
    #[msg("Mismatch Farm LP")]
    MismatchFarmLP,
    #[msg("Mismatch vault tokens")]
    MismatchVaultTokens,
}
