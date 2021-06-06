use solana_program::program_error::{ProgramError};
use solana_program::{ msg };
use borsh::{BorshDeserialize,BorshSerialize};
use serde::{Serialize};

use crate::error::EscrowError::InvalidInstruction;

#[derive(BorshDeserialize,BorshSerialize, Debug, Serialize)]
pub struct ProvideLPData  {
    pub instruction: u8,
    pub max_coin_amount: u64,
    pub max_pc_amount: u64,
    pub fixed_from_coin: u64,
}

#[derive(BorshDeserialize,BorshSerialize, Debug, Serialize)]
pub struct DepositData {
    pub instruction: u8,
    pub amount: u64,
}

pub enum EscrowInstruction {

        /// Accepts a trade
    ///
    ///
    /// Provide LP:
    ///
    /// 0. `[writable]` token program id
    /// 1. `[writable]` amm id
    /// 2. `[writable]` amm authority
    /// 3. `[writable]` amm open orders
    /// 4. `[writable]` amm target orders
    /// 5. `[writable]` lp mint address
    /// 6. `[writable]` pool coin token account
    /// 7. `[writable]` pool pc token account
    /// 8. `[writable]` user coin token account
    /// 9. `[writable]` user pc token account
    /// 10.`[writable]` user lp token account
    /// 11.`[signer]` user owner 
    ProvideLP {
        instruction: u8,
        max_coin_amount: u64,
        max_pc_amount: u64,
        fixed_from_coin: u64,
    },

    Deposit {
        instruction: u8,
        amount: u64,
    }

}

impl EscrowInstruction {
    /// Unpacks a byte buffer into a [EscrowInstruction](enum.EscrowInstruction.html).
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, _rest) = input.split_first().ok_or(InvalidInstruction)?;
        match tag {
            1 => {
                let data = DepositData::try_from_slice(input)?;
                Ok(Self::Deposit {
                    instruction: data.instruction,
                    amount: data.amount,
                })
            },
            3 => {
                let data = ProvideLPData::try_from_slice(input)?;
                return Ok(Self::ProvideLP {
                    instruction: data.instruction,
                    max_coin_amount: data.max_coin_amount,
                    max_pc_amount: data.max_pc_amount,
                    fixed_from_coin: data.fixed_from_coin,
                })
            },
            _ => return Err(InvalidInstruction.into())
        }
    }

    // fn unpack_amount(input: &[u8]) -> Result<u64, ProgramError> {
    //     let amount = input
    //         .get(..8)
    //         .and_then(|slice| slice.try_into().ok())
    //         .map(u64::from_le_bytes)
    //         .ok_or(InvalidInstruction)?;
    //     Ok(amount)
    // }
}
