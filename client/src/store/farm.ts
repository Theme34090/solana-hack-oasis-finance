import { Connection, PublicKey } from "@solana/web3.js";
import { get, cloneDeep } from "lodash-es";
import { getFarmByPoolId } from "../utils/farms";
import { lt, TokenAmount } from "../utils/safe-math";
import { USER_STAKE_INFO_ACCOUNT_LAYOUT_V4 } from "../utils/layouts";
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



// ref: src/pages/farms.vue line:280
export function updateFarms(
    // result from getFarmRewardAccount
    farmInfos: { [poolId: string]: any },

    // result from getStakeAccounts
    stakeAccounts: any,

    // TODO : unknown variables
    liquidity: any,

    price: any,
) {
    const farms: any = []

    for (const [poolId, farmInfo] of Object.entries(farmInfos)) {

        if (!farmInfo.isStake && ![4, 5].includes(farmInfo.version)) {

            let userInfo = get(stakeAccounts, poolId)
            const { rewardPerShareNet, rewardPerBlock } = farmInfo.poolInfo

            const { reward, lp } = farmInfo

            const newFarmInfo = cloneDeep(farmInfo)
            if (reward && lp) {
                const rewardPerBlockAmount = new TokenAmount(rewardPerBlock.toNumber(), reward.decimals);
                const liquidityItem = get(liquidity, lp.mintAddress);
                const rewardPerBlockAmountTotalValue =
                    rewardPerBlockAmount.toEther().toNumber() *
                    2 *
                    60 *
                    60 *
                    24 *
                    365 *
                    price[reward.symbol as string]

                const liquidityCoinValue =
                    (liquidityItem?.coin.balance as TokenAmount).toEther().toNumber() *
                    price[liquidityItem?.coin.symbol as string]
                const liquidityPcValue =
                    (liquidityItem?.pc.balance as TokenAmount).toEther().toNumber() *
                    price[liquidityItem?.pc.symbol as string]

                const liquidityTotalValue = liquidityPcValue + liquidityCoinValue
                const liquidityTotalSupply = (liquidityItem?.lp.totalSupply as TokenAmount).toEther().toNumber()
                const liquidityItemValue = liquidityTotalValue / liquidityTotalSupply

                const liquidityUsdValue = lp.balance.toEther().toNumber() * liquidityItemValue
                const apr = ((rewardPerBlockAmountTotalValue / liquidityUsdValue) * 100).toFixed(2)

                // // @ts-ignore
                newFarmInfo.apr = apr
                // // @ts-ignore
                newFarmInfo.liquidityUsdValue = liquidityUsdValue
            }



            if (userInfo) {
                userInfo = cloneDeep(userInfo)

                const { rewardDebt, depositBalance } = userInfo

                const pendingReward = depositBalance.wei
                    .multipliedBy(rewardPerShareNet.toNumber())
                    .dividedBy(1e9)
                    .minus(rewardDebt.wei)

                userInfo.pendingReward = new TokenAmount(pendingReward, rewardDebt.decimals)
            } else {
                userInfo = {
                    // @ts-ignore
                    depositBalance: new TokenAmount(0, farmInfo.lp.decimals),
                    // @ts-ignore
                    pendingReward: new TokenAmount(0, farmInfo.reward.decimals)
                }
            }

            farms.push({
                userInfo,
                farmInfo: newFarmInfo
            })
        }
    }

    return farms
}


