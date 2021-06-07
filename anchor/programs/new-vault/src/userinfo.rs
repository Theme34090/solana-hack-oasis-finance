use anchor_lang::solana_program::{
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};

use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};

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
