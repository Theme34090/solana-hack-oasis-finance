use solana_program::program_error::{ProgramError};
use solana_program::{ msg };
use std::convert::TryInto;
use borsh::{BorshDeserialize,BorshSerialize};
use serde::{Serialize,Deserialize};

use crate::error::EscrowError::InvalidInstruction;

#[derive(BorshDeserialize,BorshSerialize, Debug, Serialize)]
pub struct ProvideLPData  {
    pub instruction: u8,
    pub max_coin_amount: u64,
    pub max_pc_amount: u64,
    pub fixed_from_coin: u64,
}

pub enum EscrowInstruction {
    /// Starts the trade by creating and populating an escrow account and transferring ownership of the given temp token account to the PDA
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person initializing the escrow
    /// 1. `[writable]` Temporary token account that should be created prior to this instruction and owned by the initializer
    /// 2. `[]` The initializer's token account for the token they will receive should the trade go through
    /// 3. `[writable]` The escrow account, it will hold all necessary info about the trade.
    /// 4. `[]` The rent sysvar
    /// 5. `[]` The token program
    InitEscrow {
        /// The amount party A expects to receive of token Y
        amount: u64,
    },
    /// Accepts a trade
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person taking the trade
    /// 1. `[writable]` The taker's token account for the token they send
    /// 2. `[writable]` The taker's token account for the token they will receive should the trade go through
    /// 3. `[writable]` The PDA's temp token account to get tokens from and eventually close
    /// 4. `[writable]` The initializer's main account to send their rent fees to
    /// 5. `[writable]` The initializer's token account that will receive tokens
    /// 6. `[writable]` The escrow account holding the escrow info
    /// 7. `[]` The token program
    /// 8. `[]` The PDA account
    Exchange {
        /// the amount the taker expects to be paid in the other token, as a u64 because that's the max possible supply of a token
        amount: u64,
    },
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

    MockRaydium {
        instruction: u8,
        max_coin_amount: u64,
        max_pc_amount: u64,
        fixed_from_coin: u64,
    }
}

impl EscrowInstruction {
    /// Unpacks a byte buffer into a [EscrowInstruction](enum.EscrowInstruction.html).
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, _rest) = input.split_first().ok_or(InvalidInstruction)?;
        
        match tag {
            2 => {
                let data = ProvideLPData::try_from_slice(input)?;
                // TODO: remove mock invoke radium
                return Ok(Self::MockRaydium{
                    instruction: data.instruction,
                    max_coin_amount: data.max_coin_amount,
                    max_pc_amount: data.max_pc_amount,
                    fixed_from_coin: data.fixed_from_coin,
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
