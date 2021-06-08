import { cloneDeep, get } from "lodash-es";
import axios from "axios";


import { FarmInfo } from "../../utils/farms"
import { TokenAmount } from "../../utils/safe-math"
import { TokenInfo } from "../../utils/tokens";



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


export const updateFarmV2 = (
    // result from getFarmRewardAccount
    farmInfos: { [poolId: string]: any },

    // result from getStakeAccounts
    stakeAccounts: any,

    // TODO : unknown variables
    liquidity: any,

    price: any,
) => {
    // get stake account by poolId
    let userInfo = get(stakeAccounts, "2Bsexc5j6vk4r9RhBYz2ufPrRWhumXQk6efXucqUKsyr");

    // get farm info of lp mint address
    const farmInfo = farmInfos["2Bsexc5j6vk4r9RhBYz2ufPrRWhumXQk6efXucqUKsyr"];

    const { perBlock, perBlockB, perShare, perShareB } = farmInfo.poolInfo

    const { reward, rewardB, lp } = farmInfo;

    const newFarmInfo = cloneDeep(farmInfo)

    // const price = { "TEST1" : 0.2056 , "TEST2": 0.5607}
    const { apr, liquidityUsdValue } = calculate(liquidity, perBlock, perShare, reward, price, lp)
    // const { apr, liquidityUsdValue } = calculate(liquidity, perBlockB, perShareB, rewardB, price, lp)
    console.log(apr, liquidityUsdValue);



}

const calculate = (liquidity: any, perBlock: any, perShare: any, reward: TokenInfo, price: any, lp: any) => {
    const rewardPerBlockAmount = new TokenAmount(perBlock.toNumber(), reward.decimals);
    // get liquidity of lp mint address
    const liquidityItem = get(liquidity, "14Wp3dxYTQpRMMz3AW7f2XGBTdaBrf1qb2NKjAN3Tb13");
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

    return {
        apr,
        liquidityUsdValue
    }
}
