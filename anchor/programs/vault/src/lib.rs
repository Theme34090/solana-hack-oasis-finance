use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Burn, Mint, MintTo, TokenAccount, Transfer};

#[program]
pub mod vault {
    use super::*;
    pub fn initialize(ctx: Context<InitializeVault>, nonce: u8) -> ProgramResult {
        let vault_account = &mut ctx.accounts.vault_account;
        vault_account.vault_mint = *ctx.accounts.vault_mint.to_account_info().key;
        vault_account.nonce = nonce;
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
    // might need for holding target token in future
    // #[account(mut, "vault_token.owner == *vault_signer.key")]
    // pub vault_token: CpiAccount<'info, TokenAccount>,
    
    // #[account("token_program.key == &token::ID")]
    // pub token_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    // pub clock: Sysvar<'info, Clock>,
}

#[account]
pub struct VaultAccount {
    pub vault_mint: Pubkey,
    pub nonce: u8,
}

// #[associated]
// pub struct Token {
//     pub amount: u32,
//     pub authority: Pubkey,
//     pub mint: Pubkey,
// }