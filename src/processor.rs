use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::{invoke},
    program_error::ProgramError,
    pubkey::Pubkey,
    instruction::{Instruction, AccountMeta}
};

use crate::{instruction::{RaydiumInstruction, ProvideLPData, DepositData}, state::{Raydium}};




pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = RaydiumInstruction::unpack(instruction_data)?;

        match instruction {
            RaydiumInstruction::Deposit{
                instruction,
                amount,
            } => {
                msg!("Instruction: Deposit");    
                Self::deposit(
                    accounts, 
                    instruction,
                    amount,
                    program_id
                )
            },
            RaydiumInstruction::Withdraw {
                instruction,
                amount,
            } => {
                msg!("Instruction: Withdraw");    
                Self::withdraw(
                    accounts, 
                    instruction,
                    amount,
                    program_id
                )

            },

            RaydiumInstruction::DepositV4 {
                instruction,
                amount,
            } => {
                msg!("Instruction: New Deposit!!!!"); 
                Self::deposit_v4(
                    accounts, 
                    instruction,
                    amount,
                    program_id
                )
            },
            RaydiumInstruction::ProvideLP {        
                instruction,
                max_coin_amount,
                max_pc_amount,
                fixed_from_coin, 
            } => {
                msg!("Instruction: Provide LP");    
                Self::process_provide_lp(
                    accounts, 
                    instruction, 
                    max_coin_amount, 
                    max_pc_amount, 
                    fixed_from_coin, 
                    program_id
                )

            }   
        }
    }

    fn process_provide_lp(
        accounts: &[AccountInfo],
        instruction: u8,
        max_coin_amount: u64,
        max_pc_amount: u64,
        fixed_from_coin: u64,
        _program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        
        
        let account_metas = vec![
            // token program
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
            // amm program
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
            // amm authority 
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
            // amm open orders
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
            // amm target orders
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
            // lp mint address
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
            // pool coin token account
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
            // pool pc token account
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
            // serum market 
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
            // user coin token account
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
            // user pc token account
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
            // user lp token account
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
            // user owner 
            AccountMeta::new(*next_account_info(account_info_iter)?.key, true),
        ];

        // include program id in account meta
        // let acc = AccountMeta::new(*program_id, false);

        // Pubkey::find_program_address(seeds, program_id);

    
        // invoke(instruction: &Instruction, account_infos: &[AccountInfo]);
        // let program_account = AccountInfo::from(program_id);
        let ray_program = next_account_info(account_info_iter)?;
        let ix = Instruction::new_with_bincode(
            *ray_program.key, 
            &ProvideLPData {
                instruction,
                max_coin_amount,
                max_pc_amount,
                fixed_from_coin,
            },
            account_metas.to_vec()
        );
    
        msg!("prepared cross program invocation");
        invoke(&ix, accounts)?;
        msg!("Received all accounts......");

        Ok(())
    }


    pub fn deposit(
        accounts: &[AccountInfo],
        instruction: u8,
        amount: u64,
        _program_id: &Pubkey,
    ) -> ProgramResult {

        let account_info_iter = &mut accounts.iter();
        let account_metas = vec![
        // poolId
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // pool authority
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // user info account 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // user owner account
        AccountMeta::new(*next_account_info(account_info_iter)?.key, true),
        // user lp token account 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // pool lp token account 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // user reward token account 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // pool reward token account 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // sys var clock
        AccountMeta::new_readonly(*next_account_info(account_info_iter)?.key, false),
        // token program 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // user reward token account b
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // pool reward token account b 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        ];

        let ray_program = next_account_info(account_info_iter)?;
        let ix = Instruction::new_with_bincode(
            *ray_program.key, 
            &DepositData{
                instruction,
                amount,
            },
            account_metas.to_vec()
        );
    
        msg!("prepared cross program invocation");
        invoke(&ix, accounts)?;
        msg!("Received all accounts......");

        Ok(())
    }

    pub fn withdraw(
        accounts: &[AccountInfo],
        instruction: u8,
        amount: u64,
        program_id: &Pubkey,
    ) -> ProgramResult {

        let account_info_iter = &mut accounts.iter();
        let account_metas = vec![
        // poolId
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // pool authority
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // user info account 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // user owner account
        AccountMeta::new(*next_account_info(account_info_iter)?.key, true),
        // user lp token account 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // pool lp token account 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // user reward token account 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // pool reward token account 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // sys var clock
        AccountMeta::new_readonly(*next_account_info(account_info_iter)?.key, false),
        // token program 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // user reward token account b
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        // pool reward token account b 
        AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        ];

        let ray_program = next_account_info(account_info_iter)?;
        let ix = Instruction::new_with_bincode(
            *ray_program.key, 
            &DepositData{
                instruction,
                amount,
            },
            account_metas.to_vec()
        );
    
        msg!("prepared cross program invocation");
        invoke(&ix, accounts)?;
        msg!("Received all accounts......");

        Ok(())
    }

    pub fn deposit_v4(
        accounts: &[AccountInfo],
        instruction: u8,
        amount: u64,
        program_id: &Pubkey,
    ) -> ProgramResult {

        msg!("received {} of amount {} ", instruction , amount);
        let account_info_iter = &mut accounts.iter();


        let _account_metas = vec![
            // poolId
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
            // pool authority
            AccountMeta::new(*next_account_info(account_info_iter)?.key, false),
        ];

        let _user_info_account = next_account_info(account_info_iter)?;

        // if user_info_account.owner != program_id {
        //     msg!("Unauthorized account");
        //     return Err(ProgramError::IncorrectProgramId);
        // }

        let user_owner_account = next_account_info(account_info_iter)?;

        if !user_owner_account.is_signer{
            msg!("Invalid signer");
            return Err(ProgramError::MissingRequiredSignature);
        }

        let _user_lp_token_account = next_account_info(account_info_iter)?;
        let _pool_lp_token_account = next_account_info(account_info_iter)?;
        
        let user_reward_token_account = next_account_info(account_info_iter)?;
        if user_reward_token_account.owner != program_id {
            msg!("invalid user reward token account");
            return Err(ProgramError::IncorrectProgramId);
        }

        let _pool_reward_token_account = next_account_info(account_info_iter)?;

        let _sys_var_clock = next_account_info(account_info_iter)?;

        let _token_program_account = next_account_info(account_info_iter)?;

        let user_reward_token_account_b = next_account_info(account_info_iter)?;
        if user_reward_token_account_b.owner != program_id {
            msg!("invalid user reward token account b");
            return Err(ProgramError::IncorrectProgramId);
        }
        
        let _pool_reward_token_account_b = next_account_info(account_info_iter)?;

    
        Ok(())

    }

}
