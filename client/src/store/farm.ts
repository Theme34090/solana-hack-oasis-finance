import { Connection, PublicKey } from "@solana/web3.js";
import { getFarmByPoolId } from "../utils/farms";
import { STAKE_PROGRAM_ID } from "../utils/ids";
import { lt, TokenAmount } from "../utils/safe-math";
import { getFilterProgramAccounts } from "../utils/web3";


// TODO: support farm v4 and v5 ref: src/store/farm.ts line 138
export async function getStakeAccounts(
    connection: Connection,
    wallet: any,
    connected: boolean
) {
    if (!wallet || !connected) return;

    // stake user info account 
    const stakeFilters = [
        {
            memcmp: {
                offset: 40,
                bytes: wallet.publicKey.toBase58()
            }
        },
        // {
        //     // TODO: create from my layout
        //     dataSize: "USER_STAKE_INFO_ACCOUNT_LAYOUT.span"
        // }
    ];
    const stakeAccounts: any = {}

    const stakeAccountsInfos =
        await getFilterProgramAccounts(
            connection,
            new PublicKey(STAKE_PROGRAM_ID),
            stakeFilters
        );

    stakeAccountsInfos.forEach((stakeAccountInfo) => {
        const stakeAccountAddress = stakeAccountInfo.publicKey.toBase58();
        const { data } = stakeAccountInfo.accountInfo;

        //@ts-ignore
        const userStakeInfo = USER_STAKE_INFO_ACCOUNT_LAYOUT.decode(data)

        const poolId = userStakeInfo.poolId.toBase58();

        const rewardDebt = userStakeInfo.rewardDebt.toNumber();

        const farm = getFarmByPoolId(poolId);

        if (farm) {
            const depositBalance = new TokenAmount(userStakeInfo.depositBalance.toNumber(), farm.lp.decimals)
            if (Object.prototype.hasOwnProperty.call(stakeAccounts, poolId)) {
                if (lt(stakeAccounts[poolId].depositBalance.wei.toNumber(), depositBalance.wei.toNumber())) {
                    stakeAccounts[poolId] = {
                        depositBalance,
                        rewardDebt: new TokenAmount(rewardDebt, farm.reward.decimals),
                        stakeAccountAddress
                    }
                }
            } else {
                stakeAccounts[poolId] = {
                    depositBalance,
                    rewardDebt: new TokenAmount(rewardDebt, farm.reward.decimals),
                    stakeAccountAddress
                }
            }
        }


    });

    return stakeAccounts;
}