use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Burn, Mint, MintTo, TokenAccount, Transfer};

#[program]
pub mod vault {
    use super::*;
    pub fn initialize(ctx: Context<InitializeVault>, nonce: u8) -> ProgramResult {
        let vault_account = &mut ctx.accounts.vault_account;
        vault_account.vault_mint = *ctx.accounts.vault_mint.to_account_info().key;
        vault_account.vault_farm_lp = *ctx.accounts.vault_farm_lp.to_account_info().key;
        vault_account.farm_lp_mint = *ctx.accounts.farm_lp_mint.to_account_info().key;
        vault_account.nonce = nonce;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> ProgramResult {
        if ctx.accounts.user_farm_lp.amount < amount {
            return Err(ErrorCode::InsufficientLP.into());
        }
        
        // transfer target LP to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_farm_lp.to_account_info(),
            to: ctx.accounts.vault_farm_lp.to_account_info(),
            authority: ctx.accounts.user_authority.clone(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // mint vault tokens to user's vault account.
        let seeds = &[
            ctx.accounts.vault_account.to_account_info().key.as_ref(),
            &[ctx.accounts.vault_account.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = MintTo {
            mint: ctx.accounts.vault_mint.to_account_info(),
            to: ctx.accounts.user_vault_token.to_account_info(),
            authority: ctx.accounts.vault_signer.clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::mint_to(cpi_ctx, amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(init)]
    pub vault_account: ProgramAccount<'info, VaultAccount>,
    /*
    signer for this program to sign some tx by itself
    but signer need to be passed from client
    then program will combine it with nonce to create signer key
    in this case use signer to sign mint tx
    */
    pub vault_signer: AccountInfo<'info>,
    #[account(
        "vault_mint.mint_authority == COption::Some(*vault_signer.key)",
        "vault_mint.supply == 0"
    )]
    pub vault_mint: CpiAccount<'info, Mint>,
    #[account(mut, "vault_farm_lp.owner == *vault_signer.key")]
    pub vault_farm_lp: CpiAccount<'info, TokenAccount>,
    pub farm_lp_mint: CpiAccount<'info, Mint>,
    // #[account("token_program.key == &token::ID")]
    // pub token_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    // pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(has_one = vault_mint, has_one = vault_farm_lp)]
    pub vault_account: ProgramAccount<'info, VaultAccount>,
    #[account(seeds = [vault_account.to_account_info().key.as_ref(), &[vault_account.nonce]])]
    vault_signer: AccountInfo<'info>,
    #[account(
        mut,
        "vault_mint.mint_authority == COption::Some(*vault_signer.key)"
    )]
    pub vault_mint: CpiAccount<'info, Mint>,
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
    pub clock: Sysvar<'info, Clock>,
}

#[account]
pub struct VaultAccount {
    pub vault_mint: Pubkey,
    pub vault_farm_lp: Pubkey,
    pub farm_lp_mint: Pubkey,
    pub nonce: u8,
}

#[error]
pub enum ErrorCode {
    #[msg("Insufficient LP tokens")]
    InsufficientLP,
}

// #[associated]
// pub struct Token {
//     pub amount: u32,
//     pub authority: Pubkey,
//     pub mint: Pubkey,
// }