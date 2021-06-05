import { cloneDeep, get } from "lodash-es";
import axios from "axios";


import { FarmInfo } from "../../utils/farms"
import { TokenAmount } from "../../utils/safe-math"



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


