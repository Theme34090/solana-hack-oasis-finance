import { Connection, PublicKey } from "@solana/web3.js";
import { getFarmByPoolId } from "../utils/farms";
import { STAKE_PROGRAM_ID } from "../utils/ids";
import { lt, TokenAmount } from "../utils/safe-math";
import { USER_STAKE_INFO_ACCOUNT_LAYOUT, USER_STAKE_INFO_ACCOUNT_LAYOUT_V4 } from "../utils/stake";
import { getFilterProgramAccounts } from "../utils/web3";



export type StakeAccounts = {
    [poolId: string]: {
        depositBalance: TokenAmount;
        rewardDebt: TokenAmount;
        rewardDebtB: TokenAmount;
        stakeAccountAddress: string;
    };
};


// TODO: support farm v4 and v5 ref: src/store/farm.ts line 138
export async function getStakeAccounts(
    connection: Connection,
    wallet: any,
    connected: boolean
): Promise<StakeAccounts> {
    console.log("get Stake accounts...")
    if (!wallet || !connected) return {};

    // stake user info account 
    const stakeFilters = [
        {
            memcmp: {
                offset: 40,
                bytes: wallet.publicKey.toBase58()
            }
        },
        {
            // TODO: create from my layout
            dataSize: USER_STAKE_INFO_ACCOUNT_LAYOUT_V4.span
        }
    ];
    const stakeAccounts: any = {}

    const stakeAccountsInfos =
        await getFilterProgramAccounts(
            connection,
            // new PublicKey(STAKE_PROGRAM_ID),
            new PublicKey("EcLzTrNg9V7qhcdyXDe2qjtPkiGzDM2UbdRaeaadU5r2"),
            stakeFilters
        );

    stakeAccountsInfos.forEach((stakeAccountInfo) => {

        const stakeAccountAddress = stakeAccountInfo.publicKey.toBase58();
        const { data } = stakeAccountInfo.accountInfo;

        // //@ts-ignore
        const userStakeInfo = USER_STAKE_INFO_ACCOUNT_LAYOUT_V4.decode(data)


        const poolId = userStakeInfo.poolId.toBase58();

        const rewardDebt = userStakeInfo.rewardDebt.toNumber();
        const rewardDebtB = userStakeInfo.rewardDebtB.toNumber()

        const farm = getFarmByPoolId(poolId);

        if (farm) {
            const depositBalance = new TokenAmount(userStakeInfo.depositBalance.toNumber(), farm.lp.decimals)
            if (Object.prototype.hasOwnProperty.call(stakeAccounts, poolId)) {
                if (lt(stakeAccounts[poolId].depositBalance.wei.toNumber(), depositBalance.wei.toNumber())) {
                    stakeAccounts[poolId] = {
                        depositBalance,
                        rewardDebt: new TokenAmount(rewardDebt, farm.reward.decimals),
                        rewardDebtB: new TokenAmount(rewardDebtB, farm.rewardB!.decimals),
                        stakeAccountAddress
                    }
                }
            } else {
                stakeAccounts[poolId] = {
                    depositBalance,
                    rewardDebt: new TokenAmount(rewardDebt, farm.reward.decimals),
                    rewardDebtB: new TokenAmount(rewardDebtB, farm.rewardB!.decimals),
                    stakeAccountAddress
                }
            }
        }
    });

    return stakeAccounts;
}