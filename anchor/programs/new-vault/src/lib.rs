use anchor_lang::prelude::borsh::{BorshDeserialize, BorshSerialize};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::Instruction,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_option::COption,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};
use anchor_spl::token::{self, Burn, Mint, MintTo, TokenAccount, Transfer};
use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};

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
            *ctx.accounts.raydium_stake_program.key,
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
        let user_info = RaydiumUserInfoAccount::unpack_from_slice(
            &ctx.accounts.vault_user_info_account.data.borrow(),
        )?;
        let mint_amount = if user_info.deposit_balance == 0 {
            amount
        } else {
            amount * ctx.accounts.vault_token_mint_address.supply / user_info.deposit_balance
        };

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
        token::mint_to(cpi_ctx, mint_amount)?;

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
            *ctx.accounts.raydium_stake_program.key,
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

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
        msg!("deposit");
        let vault_account = &ctx.accounts.vault_account;

        // calculate LP amount that user will receive after burn
        let user_info = RaydiumUserInfoAccount::unpack_from_slice(
            &ctx.accounts.vault_user_info_account.data.borrow(),
        )?;
        let receive_amount =
            amount * user_info.deposit_balance / ctx.accounts.vault_token_mint_address.supply;

        // transfer user's LP to vault account
        msg!("burn user's vault token");
        let cpi_accounts = Burn {
            mint: ctx.accounts.vault_token_mint_address.to_account_info(),
            to: ctx.accounts.user_vault_token_account.to_account_info(),
            authority: ctx.accounts.user_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, amount)?;

        msg!("withdraw raydium");
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
            *ctx.accounts.raydium_stake_program.key,
            &DepositData {
                instruction: 2,
                amount: receive_amount,
            },
            account_metas,
        );
        msg!("invoking raydium");
        invoke_signed(&ix, &accounts, signer)?;

        // transfer LP back to user
        let seeds = &[
            ctx.accounts.vault_account.to_account_info().key.as_ref(),
            &[vault_account.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_lp_token_account.to_account_info(),
            to: ctx.accounts.user_lp_token_account.to_account_info(),
            authority: ctx.accounts.vault_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, receive_amount)?;

        Ok(())
    }

    pub fn compound(ctx: Context<Compound>) -> ProgramResult {
        msg!("compound");
        // let vault_account = &ctx.accounts.vault_account;
        msg!("harvest raydium");
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
            *ctx.accounts.raydium_stake_program.key,
            &DepositData {
                instruction: 1,
                amount: 0, // harvest by deposit amount 0
            },
            account_metas,
        );
        msg!("invoking raydium");
        invoke_signed(&ix, &accounts, signer)?;

        // calculate provide lp amount
        let price = ctx.accounts.raydium_amm_token_account.amount
            / ctx.accounts.raydium_amm_token_account.amount;
        let amount = ctx.accounts.vault_reward_token_account.amount;
        let amount_b = ctx.accounts.vault_reward_token_account_b.amount;

        msg!("provide liquidity raydium");
        let accounts = [
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.raydium_amm_id.clone(),
            ctx.accounts.raydium_amm_authority.clone(),
            ctx.accounts.raydium_amm_open_orders.clone(),
            ctx.accounts.raydium_amm_target_orders.clone(),
            ctx.accounts.raydium_lp_token_mint_address.to_account_info(),
            ctx.accounts.raydium_amm_token_account.to_account_info(),
            ctx.accounts.raydium_amm_token_account_b.to_account_info(),
            ctx.accounts.serum_market.clone(),
            ctx.accounts.vault_reward_token_account.to_account_info(),
            ctx.accounts.vault_reward_token_account_b.to_account_info(),
            ctx.accounts.vault_lp_token_account.to_account_info(),
            ctx.accounts.vault_signer.clone(),
        ];
        let account_metas = accounts
            .iter()
            .map(|acc| {
                if acc.key == ctx.accounts.vault_signer.key {
                    AccountMeta::new_readonly(*acc.key, true)
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
            *ctx.accounts.raydium_amm_program.key,
            &ProvideLiquidityData {
                instruction: 3,
                max_coin_amount: amount,
                max_pc_amount: amount_b,
                fixed_from_coin: 1,
            },
            account_metas,
        );
        msg!("invoking raydium");
        invoke_signed(&ix, &accounts, signer)?;

        Ok(())
    }

    pub fn provide_liquidity(
        ctx: Context<ProvideLiquidity>,
        amount: u64,
        amount_b: u64,
    ) -> ProgramResult {
        msg!("provide liquidity");
        // let vault_account = &ctx.accounts.vault_account;

        msg!("provide liquidity raydium");
        let accounts = [
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.raydium_amm_id.clone(),
            ctx.accounts.raydium_amm_authority.clone(),
            ctx.accounts.raydium_amm_open_orders.clone(),
            ctx.accounts.raydium_amm_target_orders.clone(),
            ctx.accounts.raydium_lp_token_mint_address.to_account_info(),
            ctx.accounts.raydium_reward_token_account.to_account_info(),
            ctx.accounts
                .raydium_reward_token_account_b
                .to_account_info(),
            ctx.accounts.serum_market.clone(),
            ctx.accounts.vault_reward_token_account.to_account_info(),
            ctx.accounts.vault_reward_token_account_b.to_account_info(),
            ctx.accounts.vault_lp_token_account.to_account_info(),
            ctx.accounts.vault_signer.clone(),
        ];
        let account_metas = accounts
            .iter()
            .map(|acc| {
                if acc.key == ctx.accounts.vault_signer.key {
                    AccountMeta::new_readonly(*acc.key, true)
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
            *ctx.accounts.raydium_amm_program.key,
            &ProvideLiquidityData {
                instruction: 3,
                max_coin_amount: amount,
                max_pc_amount: amount_b,
                fixed_from_coin: 1,
            },
            account_metas,
        );
        msg!("invoking raydium");
        invoke_signed(&ix, &accounts, signer)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Compound<'info> {
    pub vault_account: ProgramAccount<'info, VaultAccount>,
    #[account(seeds = [vault_account.to_account_info().key.as_ref(), &[vault_account.nonce]])]
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
    // raydium stake
    pub raydium_stake_program: AccountInfo<'info>,
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
    // raydium amm
    pub raydium_amm_program: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_amm_id: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_amm_authority: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_amm_open_orders: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_amm_target_orders: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_lp_token_mint_address: CpiAccount<'info, Mint>,
    #[account(mut)]
    pub raydium_amm_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub raydium_amm_token_account_b: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub serum_market: AccountInfo<'info>,
    #[account(mut, "token_program.key == &token::ID")]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct ProvideLiquidity<'info> {
    pub vault_account: ProgramAccount<'info, VaultAccount>,
    #[account(seeds = [vault_account.to_account_info().key.as_ref(), &[vault_account.nonce]])]
    pub vault_signer: AccountInfo<'info>,
    #[account(mut)]
    pub vault_lp_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_reward_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_reward_token_account_b: CpiAccount<'info, TokenAccount>,
    // raydium
    pub raydium_amm_program: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_amm_id: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_amm_authority: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_amm_open_orders: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_amm_target_orders: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_lp_token_mint_address: CpiAccount<'info, Mint>,
    #[account(mut)]
    pub raydium_reward_token_account: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub raydium_reward_token_account_b: CpiAccount<'info, TokenAccount>,
    #[account(mut)]
    pub serum_market: AccountInfo<'info>,
    #[account(mut, "token_program.key == &token::ID")]
    pub token_program: AccountInfo<'info>,
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
    pub raydium_stake_program: AccountInfo<'info>,
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

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct ProvideLiquidityData {
    pub instruction: u8,
    pub max_coin_amount: u64,
    pub max_pc_amount: u64,
    pub fixed_from_coin: u64,
}

#[account]
pub struct VaultAccount {
    // vault
    pub nonce: u8,
    pub vault_token_mint_address: Pubkey,
    pub vault_user_info_account: Pubkey,
    // // raydium
    // pub raydium_stake_program: Pubkey,
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
    pub raydium_stake_program: AccountInfo<'info>,
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
pub struct Withdraw<'info> {
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
    pub raydium_stake_program: AccountInfo<'info>,
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

// #[account]
// pub struct RaydiumUserInfoAccount {
//     pub state: u64,
//     pub pool_id: Pubkey,
//     pub staker_owner: Pubkey,
//     pub deposit_balance: u64,
//     pub reward_debt: u64,
//     pub reward_debt_b: u64,
// }

pub struct RaydiumUserInfoAccount {
    pub state: u64,
    pub pool_id: Pubkey,
    pub staker_owner: Pubkey,
    pub deposit_balance: u64,
    pub reward_debt: u64,
    pub reward_debt_b: u64,
}

impl Sealed for RaydiumUserInfoAccount {}

impl IsInitialized for RaydiumUserInfoAccount {
    fn is_initialized(&self) -> bool {
        true
    }
}

impl Pack for RaydiumUserInfoAccount {
    const LEN: usize = 96;
    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let src = array_ref![src, 0, RaydiumUserInfoAccount::LEN];
        let (state, pool_id, staker_owner, deposit_balance, reward_debt, reward_debt_b) =
            array_refs![src, 8, 32, 32, 8, 8, 8];
        // let is_initialized = match is_initialized {
        //     [0] => false,
        //     [1] => true,
        //     _ => return Err(ProgramError::InvalidAccountData),
        // };

        Ok(RaydiumUserInfoAccount {
            state: u64::from_le_bytes(*state),
            pool_id: Pubkey::new_from_array(*pool_id),
            staker_owner: Pubkey::new_from_array(*staker_owner),
            deposit_balance: u64::from_le_bytes(*deposit_balance),
            reward_debt: u64::from_le_bytes(*reward_debt),
            reward_debt_b: u64::from_le_bytes(*reward_debt_b),
        })
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let dst = array_mut_ref![dst, 0, RaydiumUserInfoAccount::LEN];
        let (
            state_dst,
            pool_id_dst,
            staker_owner_dst,
            deposit_balance_dst,
            reward_debt_dst,
            reward_debt_b_dst,
        ) = mut_array_refs![dst, 8, 32, 32, 8, 8, 8];

        let RaydiumUserInfoAccount {
            state,
            pool_id,
            staker_owner,
            deposit_balance,
            reward_debt,
            reward_debt_b,
        } = self;

        *state_dst = state.to_le_bytes();
        pool_id_dst.copy_from_slice(pool_id.as_ref());
        staker_owner_dst.copy_from_slice(staker_owner.as_ref());
        *deposit_balance_dst = deposit_balance.to_le_bytes();
        *reward_debt_dst = reward_debt.to_le_bytes();
        *reward_debt_b_dst = reward_debt_b.to_le_bytes();
    }
}
