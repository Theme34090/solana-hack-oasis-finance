import { LP_TOKENS, TOKENS, TokenInfo, LPTokensInfo } from './tokens';

import { STAKE_PROGRAM_ID, STAKE_PROGRAM_ID_V4, STAKE_PROGRAM_ID_V5 } from './ids';
import { cloneDeep } from 'lodash-es'
import { Connection, PublicKey } from '@solana/web3.js';
import { TokenAmount } from './safe-math';
import { getMultipleAccounts } from '../utils/web3';
import { commitment } from './web3';
//@ts-ignore
import { struct, u8, blob } from 'buffer-layout'
import { publicKey, u128, u64 } from '@project-serum/borsh'
import { ACCOUNT_LAYOUT } from './layouts';

export interface FarmInfo {
    name: string
    lp: LPTokensInfo
    reward: TokenInfo
    rewardB?: TokenInfo
    isStake: boolean

    fusion: boolean
    legacy: boolean
    dual: boolean
    version: number
    programId: string

    poolId: string
    poolAuthority: string

    poolLpTokenAccount: string
    poolRewardTokenAccount: string
    poolRewardTokenAccountB?: string

    user?: object
}

export function getFarmByLpMintAddress(lpMintAddress: string): FarmInfo | undefined {
    const farm = FARMS.find((farm) => farm.lp.mintAddress === lpMintAddress)

    if (farm) {
        return cloneDeep(farm)
    }

    return farm
}

export function getFarmByRewardMintAddress(lpMintAddress: string): FarmInfo | undefined {
    const farm = FARMS.find((farm) => farm.reward.mintAddress === lpMintAddress)

    if (farm) {
        return cloneDeep(farm)
    }

    return farm
}

export function getFarmByPoolId(poolId: string): FarmInfo | undefined {
    const farm = FARMS.find((farm) => farm.poolId === poolId)

    if (farm) {
        return cloneDeep(farm)
    }

    return farm
}

export function getAddressForWhat(address: string) {
    // dont use forEach
    for (const farm of FARMS) {
        for (const [key, value] of Object.entries(farm)) {
            // if (key === 'lp') {
            //   if (value.mintAddress === address) {
            //     return { key: 'poolId', poolId: farm.poolId }
            //   }
            // } else if (key === 'reward') {
            //   if (value.mintAddress === address) {
            //     return { key: 'rewardMintAddress', poolId: farm.poolId }
            //   }
            // } else

            if (value === address) {
                return { key, poolId: farm.poolId }
            }
        }
    }

    return {}
}

export const STAKE_INFO_LAYOUT = struct([
    u64('state'),
    u64('nonce'),
    publicKey('poolLpTokenAccount'),
    publicKey('poolRewardTokenAccount'),
    publicKey('owner'),
    publicKey('feeOwner'),
    u64('feeY'),
    u64('feeX'),
    u64('totalReward'),
    u128('rewardPerShareNet'),
    u64('lastBlock'),
    u64('rewardPerBlock')
])

export const STAKE_INFO_LAYOUT_V4 = struct([
    u64('state'),
    u64('nonce'),
    publicKey('poolLpTokenAccount'),
    publicKey('poolRewardTokenAccount'),
    u64('totalReward'),
    u128('perShare'),
    u64('perBlock'),
    u8('option'),
    publicKey('poolRewardTokenAccountB'),
    blob(7),
    u64('totalRewardB'),
    u128('perShareB'),
    u64('perBlockB'),
    u64('lastBlock'),
    publicKey('owner')
])

export async function getFarmRewardAccount(connection: Connection) {
    const farms = {} as any;
    const publicKeys: PublicKey[] = [];

    FARMS.forEach((farm) => {
        const { lp, poolId, poolLpTokenAccount } = farm;

        publicKeys.push(new PublicKey(poolId), new PublicKey(poolLpTokenAccount));

        const farmInfo = cloneDeep(farm);

        farmInfo.lp.balance = new TokenAmount(0, lp.decimals);

        farms[poolId] = farmInfo;
    });

    const multipleInfo = await getMultipleAccounts(connection, publicKeys, commitment);




    multipleInfo.forEach((info) => {
        if (info) {
            const address = info.publicKey.toBase58()
            const data = Buffer.from(info.account.data)

            // console.log("data :", data);
            // console.log("info :", info);
            const { key, poolId } = getAddressForWhat(address)
            if (key && poolId) {
                const farmInfo = farms[poolId]

                switch (key) {
                    // pool info
                    case 'poolId': {
                        let parsed

                        // TODO: discuss farm layout
                        if ([4, 5].includes(farmInfo.version)) {
                            parsed = STAKE_INFO_LAYOUT_V4.decode(data)
                        } else {
                            parsed = STAKE_INFO_LAYOUT.decode(data)
                        }


                        farmInfo.poolInfo = parsed

                        break
                    }
                    // staked balance
                    case 'poolLpTokenAccount': {
                        // TODO: discuss farm layout เลือกฟาร์มไหนบ้าง
                        const parsed = ACCOUNT_LAYOUT.decode(data)

                        farmInfo.lp.balance.wei = farmInfo.lp.balance.wei.plus(parsed.amount.toNumber())
                        farmInfo.lp.balance.wei = farmInfo.lp.balance.wei.plus(0)

                        break
                    }
                }
            }
        }
    })

    return farms;
}


export const FARMS: FarmInfo[] = [{
    name: 'TEST-TEST',
    lp: { ...LP_TOKENS['TEST_LPTOKEN'] },
    reward: { ...TOKENS.TEST1 },
    rewardB: { ...TOKENS.TEST2 },
    isStake: false,

    fusion: false,
    legacy: true,
    dual: false,
    version: 5,
    programId: "EcLzTrNg9V7qhcdyXDe2qjtPkiGzDM2UbdRaeaadU5r2",

    poolId: '2Bsexc5j6vk4r9RhBYz2ufPrRWhumXQk6efXucqUKsyr',
    poolAuthority: 'BxAtWJ4g6xguPsR9xNvXTK7EjuzwiKNbmKbhoXDZ3EsY',
    poolLpTokenAccount: '83BEhzv7eV4HeJuuPtYmHkhTjZEpNpK83mHnHfX5Krwj', // lp vault
    poolRewardTokenAccount: 'HVtAJ1uRiWJ7tNU9uqAzpPv14B3fN9SVEW9G4PtM77Ci', // reward vault B
    poolRewardTokenAccountB: '39Ea6rMGGrsNmEsYToqQfEyNSqv7hcUJa646qBYLY4yq'
}]

export const _FARMS: FarmInfo[] = [
    // {
    //     name: 'TEST-TEST',
    //     lp: { ...LP_TOKENS['TEST_LPTOKEN'] },
    //     reward: { ...TOKENS.TEST1 },
    //     rewardB: { ...TOKENS.TEST2 },
    //     isStake: false,

    //     fusion: false,
    //     legacy: true,
    //     dual: false,
    //     version: 5,
    //     programId: "EcLzTrNg9V7qhcdyXDe2qjtPkiGzDM2UbdRaeaadU5r2",

    //     poolId: '2Bsexc5j6vk4r9RhBYz2ufPrRWhumXQk6efXucqUKsyr',
    //     poolAuthority: 'BxAtWJ4g6xguPsR9xNvXTK7EjuzwiKNbmKbhoXDZ3EsY',
    //     poolLpTokenAccount: '83BEhzv7eV4HeJuuPtYmHkhTjZEpNpK83mHnHfX5Krwj', // lp vault
    //     poolRewardTokenAccount: 'HVtAJ1uRiWJ7tNU9uqAzpPv14B3fN9SVEW9G4PtM77Ci', // reward vault B
    //     poolRewardTokenAccountB: '39Ea6rMGGrsNmEsYToqQfEyNSqv7hcUJa646qBYLY4yq'
    // },

    // v3
    {
        name: 'RAY-WUSDT',
        lp: { ...LP_TOKENS['RAY-WUSDT-V3'] },
        reward: { ...TOKENS.RAY },
        isStake: false,

        fusion: false,
        legacy: true,
        dual: false,
        version: 3,
        programId: STAKE_PROGRAM_ID,

        // TODO: Dummy
        poolId: 'AvbVWpBi2e4C9HPmZgShGdPoNydG4Yw8GJvG9HUcLgce',
        poolAuthority: '8JYVFy3pYsPSpPRsqf43KSJFnJzn83nnRLQgG88XKB8q',
        poolLpTokenAccount: '4u4AnMBHXehdpP5tbD6qzB5Q4iZmvKKR5aUr2gavG7aw', // lp vault
        poolRewardTokenAccount: 'HCHNuGzkqSnw9TbwpPv1gTnoqnqYepcojHw9DAToBrUj' // reward vault
    },
    {
        name: 'RAY-USDT',
        lp: { ...LP_TOKENS['RAY-USDT-V4'] },
        reward: { ...TOKENS.RAY },
        isStake: false,

        fusion: false,
        legacy: false,
        dual: false,
        version: 3,
        programId: STAKE_PROGRAM_ID,

        poolId: 'AvbVWpBi2e4C9HPmZgShGdPoNydG4Yw8GJvG9HUcLgce',
        poolAuthority: '8JYVFy3pYsPSpPRsqf43KSJFnJzn83nnRLQgG88XKB8q',
        poolLpTokenAccount: '4u4AnMBHXehdpP5tbD6qzB5Q4iZmvKKR5aUr2gavG7aw', // lp vault
        poolRewardTokenAccount: 'HCHNuGzkqSnw9TbwpPv1gTnoqnqYepcojHw9DAToBrUj' // reward vault
    },
    // v2
    {
        name: 'RAY-WUSDT',
        lp: { ...LP_TOKENS['RAY-WUSDT'] },
        reward: { ...TOKENS.RAY },
        isStake: false,

        fusion: false,
        legacy: true,
        dual: false,
        version: 2,
        programId: STAKE_PROGRAM_ID,

        poolId: '5w3itB5PVAPAiPFpBcMyGZJWukmcuRtwFRkQJF3WzHdj',
        poolAuthority: '4qgEHMtCAA4Z3rY4C1ihz9JHETHFhQVqj81Q1qyB83WP',
        poolLpTokenAccount: 'n1gotGPqeUxJnA4yE7QCCsNG8AVqQ1HuATkAhAfVMVV', // lp vault
        poolRewardTokenAccount: 'h8uQ293dPdJd7qFRFE1pvMbpFmxrtD64QaxUWwis4Wv' // reward vault
    },
    {
        name: 'RAY-USDC',
        lp: { ...LP_TOKENS['RAY-USDC'] },
        reward: { ...TOKENS.RAY },
        isStake: false,

        fusion: false,
        legacy: true,
        dual: false,
        version: 2,
        programId: STAKE_PROGRAM_ID,

        poolId: '3j7qWosyu3cVNgbwdWRxEf4SxJKNWoWqgpAEn4RLpMrR',
        poolAuthority: 'BZhcMxjRy9oXSgghLN52uhsML5ooXS377yTJhkw96bYX',
        poolLpTokenAccount: '6qsk4PmATtiu132YJuUgVt4zekbTYV3xRZWxoc1rAg9U', // lp vault
        poolRewardTokenAccount: 'Aucgi2G2ufXTGGYf2ng3ZyQXLu6RH6ioL1R7mGfhUcbQ' // reward vault
    },
    {
        name: 'RAY-SRM',
        lp: { ...LP_TOKENS['RAY-SRM'] },
        reward: { ...TOKENS.RAY },
        isStake: false,

        fusion: false,
        legacy: true,
        dual: false,
        version: 2,
        programId: STAKE_PROGRAM_ID,

        poolId: 'GLQwyMF1txnAdEnoYuPTPsWdXqUuxgTMsWEV38njk48C',
        poolAuthority: '5ddsMftKDoaT5qHnHKnfkGCexJhiaNz1E4mMagy6qMku',
        poolLpTokenAccount: 'HFYPGyBW5hsQnrtQntg4d6Gzyg6iaehVTAVNqQ6f5f28', // lp vault
        poolRewardTokenAccount: 'ETwFtP1dYCbvbARNPfKuJFxoGFDTTsqB6j3pRquPE7Fq' // reward vault
    },
    // v3 farm
    {
        name: 'RAY-USDC',
        lp: { ...LP_TOKENS['RAY-USDC-V3'] },
        reward: { ...TOKENS.RAY },
        isStake: false,

        fusion: false,
        legacy: false,
        dual: false,
        version: 3,
        programId: STAKE_PROGRAM_ID,

        poolId: '8nEWqxeDNZ2yo1izbPzY4nwR55isBZRaQk7CM8ntwUwR',
        poolAuthority: '6vQGZLsHgpJdqh1ER7q2q6mjZ43QwzhtTofTzb2sUhNh',
        poolLpTokenAccount: '77ujS15hjUfFZkM8QAw4HMLvMGZg95Gcm6ixjA1bnk3M', // lp vault
        poolRewardTokenAccount: '3ejmkn5HpXR9KdVWkai1Ngo87sQSUyKXrx8wSakipkno' // reward vault
    },
    {
        name: 'RAY-SRM',
        lp: { ...LP_TOKENS['RAY-SRM-V3'] },
        reward: { ...TOKENS.RAY },
        isStake: false,

        fusion: false,
        legacy: false,
        dual: false,
        version: 3,
        programId: STAKE_PROGRAM_ID,

        poolId: 'HwEgvS79S53yzYUTRHShU6EuNmhR3WTX5tTZPUzBmwky',
        poolAuthority: '9B3XWm89zX7NwaBB8VmT5mrWvxVpd9eyfQMeqkuLkcCF',
        poolLpTokenAccount: 'F4zXXzqkyT1GP5CVdEgC7qTcDfR8ox5Akm6RCbBdBsRp', // lp vault
        poolRewardTokenAccount: 'FW7omPaCCvgBgUFKwvwU2jf1w1wJGjDrJqurr3SeXn14' // reward vault
    },
    {
        name: 'RAY-SOL',
        lp: { ...LP_TOKENS['RAY-SOL-V3'] },
        reward: { ...TOKENS.RAY },
        isStake: false,

        fusion: false,
        legacy: false,
        dual: false,
        version: 3,
        programId: STAKE_PROGRAM_ID,

        poolId: 'ECqG3sxwJiq9TTYsRBd7fPGsBKYF4fyogo6Df7c13qdJ',
        poolAuthority: '4Wf4om12g9xzEeeD139ffCuXn4W2huMcXziiSAzf7Nig',
        poolLpTokenAccount: '9kWnkQtMAW2bzKeLQsTdan1rEoypDHaAVnZRcoBPDBfQ', // lp vault
        poolRewardTokenAccount: '8z4kQbgQFe4zXE4NSozWJTJV14gD4evNq4CKn5ryB6S3' // reward vault
    },
    {
        name: 'RAY-ETH',
        lp: { ...LP_TOKENS['RAY-ETH-V3'] },
        reward: { ...TOKENS.RAY },
        isStake: false,

        fusion: false,
        legacy: false,
        dual: false,
        version: 3,
        programId: STAKE_PROGRAM_ID,

        poolId: 'CYKDTwojSLVFEShB3tcTTfMjtBxUNtYfCTM4PiMFGkio',
        poolAuthority: 'Azmucec2jdgWagFkbnqmwYcsrtKPf1v1kcM95v6s1zxu',
        poolLpTokenAccount: 'EncPBQhpc5KLmcgRD2PutQz7wBBNQkVN2s8jjFWEw9no', // lp vault
        poolRewardTokenAccount: '8q8BHw7fP7mitLrb2jzw78qcSEgCvM7GTB5PzbSQobUt' // reward vault
    },
    // stake
    // {
    //     name: 'RAY',
    //     lp: { ...TOKENS.RAY },
    //     reward: { ...TOKENS.RAY },
    //     isStake: true,

    //     fusion: false,
    //     legacy: false,
    //     dual: false,
    //     version: 2,
    //     programId: STAKE_PROGRAM_ID,

    //     poolId: '4EwbZo8BZXP5313z5A2H11MRBP15M5n6YxfmkjXESKAW',
    //     poolAuthority: '4qD717qKoj3Sm8YfHMSR7tSKjWn5An817nArA6nGdcUR',
    //     poolLpTokenAccount: '8tnpAECxAT9nHBqR1Ba494Ar5dQMPGhL31MmPJz1zZvY', // lp vault
    //     poolRewardTokenAccount: 'BihEG2r7hYax6EherbRmuLLrySBuSXx4PYGd9gAsktKY' // reward vault
    // },
    // Reward double
    {
        name: 'FIDA-RAY',
        lp: { ...LP_TOKENS['FIDA-RAY-V4'] },
        reward: { ...TOKENS.RAY },
        rewardB: { ...TOKENS.FIDA },
        isStake: false,

        fusion: true,
        legacy: false,
        dual: true,
        version: 4,
        programId: STAKE_PROGRAM_ID_V4,

        poolId: '8rAdapvcC5vYNLXzChMgt56s6HCQGE6Lbo469g3WRTUh',
        poolAuthority: 'EcCKf3mgPtL6dNNAVG4gQQtLkAoTAUdf5vzFukkrviWq',
        poolLpTokenAccount: 'H6kzwNNg9zbgC1YBjvCN4BdebtA4NusvgUhUSDZoz8rP', // lp vault
        poolRewardTokenAccount: '7vnPTB2HAXFUAV5iiVZTNHgAnVYjgXcdumbbqfeK6ugp', // reward vault A
        poolRewardTokenAccountB: 'EGHdQm9KGLz6nw7W4rK13DyAMMJcGP9RpzCJaXiq75kQ' // reward vault B
    },
    {
        name: 'OXY-RAY',
        lp: { ...LP_TOKENS['OXY-RAY-V4'] },
        reward: { ...TOKENS.RAY },
        rewardB: { ...TOKENS.OXY },
        isStake: false,

        fusion: true,
        legacy: false,
        dual: true,
        version: 4,
        programId: STAKE_PROGRAM_ID_V4,

        poolId: '7Hug9fKfTrasG3hHonXTfSnvv37mDeyoBHbVwyDjw693',
        poolAuthority: 'CcD7KXVhjoeFpbkXeBgPpZChafEfTZ4zJL47LqmKdqwz',
        poolLpTokenAccount: 'GtXoFnVRATaasBP6sroNaC54uLQfVAwGXsfKzgFqNiUc', // lp vault
        poolRewardTokenAccount: 'GKC7BcGs1515CQx6hiK562u29dFQxBw8HWwJUxqi7xf1', // reward vault A
        poolRewardTokenAccountB: 'DXDjRiC7EUUh9cj93tgBtX2jRkmnwtCMEAQD9GrYK2f6' // reward vault B
    },
    {
        name: 'MAPS-RAY',
        lp: { ...LP_TOKENS['MAPS-RAY-V4'] },
        reward: { ...TOKENS.RAY },
        rewardB: { ...TOKENS.MAPS },
        isStake: false,

        fusion: true,
        legacy: false,
        dual: true,
        version: 4,
        programId: STAKE_PROGRAM_ID_V4,

        poolId: 'Chb6atEWGmH2NitCqrCEMHB8uKWYQiiVaBnmJQDudm87',
        poolAuthority: 'BcmgQZXCDPCduv3reT8LDQNqvGeGMZtFhBxyLYdrnCjE',
        poolLpTokenAccount: '5uaBAwu1Sff58KNKGTwfacsjsrMU3wg6jtGtMWwiZd5B', // lp vault
        poolRewardTokenAccount: '4LVikvk3gZEHaTUNh7L8bsx5By6NNnkqpKfcdJTWTD7Z', // reward vault A
        poolRewardTokenAccountB: '3UWGpEe2NLD9oWPW1zdXGZRCvJxkNSC2puUWooNEugdS' // reward vault B
    },
    {
        // legacy
        name: 'KIN-RAY',
        lp: { ...LP_TOKENS['KIN-RAY-V4'] },
        reward: { ...TOKENS.RAY },
        rewardB: { ...TOKENS.KIN },
        isStake: false,

        fusion: true,
        legacy: true,
        dual: true,
        version: 4,
        programId: STAKE_PROGRAM_ID_V4,

        poolId: '7RFY9eMaD3nsV7EBTzVzuKBr4X4cLuDh3JaoWZTcGiJK',
        poolAuthority: 'q42hNDzfBDQ1WzKjxkueEtBzX1VPJ2hnikJXFjSYC91',
        poolLpTokenAccount: 'DgCSAJiicdEggHJxM7Vs2j59yM5wMJMCGzUHALiVDhtX', // lp vault
        poolRewardTokenAccount: '3BGPPWYJMSFaWmq21x8Feqvgsii1fVmJiivRuPJSgXe1', // reward vault A
        poolRewardTokenAccountB: '5uX6ceRRxDRrcARddFkypCZV5MXz5KUQDr7Zf9ZnSSLf' // reward vault B
    },
    {
        name: 'KIN-RAY',
        lp: { ...LP_TOKENS['KIN-RAY-V4'] },
        reward: { ...TOKENS.RAY },
        rewardB: { ...TOKENS.KIN },
        isStake: false,

        fusion: true,
        legacy: false,
        dual: true,
        version: 5,
        programId: STAKE_PROGRAM_ID_V5,

        poolId: 'FgApVk6mASrkuWNxmsFvsaAYkFKqdiwMTvYZK36A2DaC',
        poolAuthority: '7kEx8qnkZPkRXV6f4ztf27zYjCACBHY3PUMfuiYJsoML',
        poolLpTokenAccount: '7fgDjhZn9GqRZbbCregr9tpkbWSKjibdCsJNBYbLhLir', // lp vault
        poolRewardTokenAccount: '5XZjRyEo8Wr2CtSE5bpoKioThT9czK1dUebbK87Lqkaa', // reward vault A
        poolRewardTokenAccountB: '8jGJ3ST1j9eemfC6N2qQevtUdwxT7TpXW1NmvWyvLLVs' // reward vault B
    },
    {
        name: 'xCOPE-USDC',
        lp: { ...LP_TOKENS['xCOPE-USDC-V4'] },
        reward: { ...TOKENS.RAY },
        rewardB: { ...TOKENS.xCOPE },
        isStake: false,

        fusion: true,
        legacy: true,
        dual: false,
        version: 5,
        programId: STAKE_PROGRAM_ID_V5,

        poolId: 'XnRBbNMf6YcWvC1u2vBXXuMcagmRBRLu1y84mpqnKwW',
        poolAuthority: 'AnYvA5H7oBeA1otnWHSu8ud3waFsEmfUbdAoM1VzdVvt',
        poolLpTokenAccount: '6tXWzm8nLVtNtvqDH8bZNfUwpSjEcKZoJFpcV4hC5rLD', // lp vault
        poolRewardTokenAccount: '8GoDpozsDk3U3J36vvPiq3YpnA6MeJb1QPVJFiupe2wR', // reward vault A
        poolRewardTokenAccountB: '7niS4ngxgZ3oynHwH82PnwJXicTnY3fo9Vubi1PnjzJq' // reward vault B
    },
    {
        name: 'STEP-USDC',
        lp: { ...LP_TOKENS['STEP-USDC-V4'] },
        reward: { ...TOKENS.RAY },
        rewardB: { ...TOKENS.STEP },
        isStake: false,

        fusion: true,
        legacy: false,
        dual: false,
        version: 5,
        programId: STAKE_PROGRAM_ID_V5,

        poolId: '8xhjCzfzVcP79jE7jXR2xtNaSL6aJYoDRLVT9FMjpRTC',
        poolAuthority: '6wRMPrHKFzj3qB4j5yj4y9mDF89fZ6w7gD1cEzCJwT9B',
        poolLpTokenAccount: 'CP3wdgdSygYGLJMjKfbJMiANnYuAxXHPiLTtB124tzVX', // lp vault
        poolRewardTokenAccount: '3zSiR4XrrRPhsom2hh9iigYZZ7uCpMucfJnZRgREgH8j', // reward vault A
        poolRewardTokenAccountB: '4n3vRUk3wdtbGWgMFSaxUcnGLKwa2wiWVhqw7kv9JDVS' // reward vault B
    },
    {
        name: 'MEDIA-USDC',
        lp: { ...LP_TOKENS['MEDIA-USDC-V4'] },
        reward: { ...TOKENS.RAY },
        rewardB: { ...TOKENS.MEDIA },
        isStake: false,

        fusion: true,
        legacy: false,
        dual: false,
        version: 5,
        programId: STAKE_PROGRAM_ID_V5,

        poolId: 'Ef1gD9JMzWF6PNw2uc4744zouh57GyWAeVTjHHbQ2nsu',
        poolAuthority: '3dhU2g3MSHK3LwjuE1VsEJCsNeWKyBJUMHt4EUXepTjs',
        poolLpTokenAccount: 'DGjRtqsjeubLCLPD3yH8fj1d7TnrD3jKBpwa1UbVk7E6', // lp vault
        poolRewardTokenAccount: 'Uen8f9Rn42i8sDTK5vEttrnX9AUwXV3yf6DFU63mKDb', // reward vault A
        poolRewardTokenAccountB: 'Ek6n7Myojb6pSpQuqk5AyS7KXQdXkJyZT7ki9baYCxds' // reward vault B
    },
    {
        name: 'COPE-USDC',
        lp: { ...LP_TOKENS['COPE-USDC-V4'] },
        reward: { ...TOKENS.RAY },
        rewardB: { ...TOKENS.COPE },
        isStake: false,

        fusion: true,
        legacy: false,
        dual: false,
        version: 5,
        programId: STAKE_PROGRAM_ID_V5,

        poolId: 'AxVvbT9fDFEkmdLwKUJRY5HsG2RXAZbe1dRAgJ2bDDwg',
        poolAuthority: '3n1Vdmqu1MBUpBYMpYbpJAVFv4MeNMEa82waruLy7BDu',
        poolLpTokenAccount: 'BHLzrd5MgQy4NgmUsn542yXRZWkz1iV5bfWg8s8D4tVL', // lp vault
        poolRewardTokenAccount: '7nGY6xHCUR2MxJnHT1qvArRUEnpo2DsGGf6Pdu3tt9gv', // reward vault A
        poolRewardTokenAccountB: '6ezx1EivkxsJcZLYhSJFLc3nUs25iyubf8PPyRNEX3pL' // reward vault B
    },
    {
        name: 'MER-USDC',
        lp: { ...LP_TOKENS['MER-USDC-V4'] },
        reward: { ...TOKENS.RAY },
        rewardB: { ...TOKENS.MER },
        isStake: false,

        fusion: true,
        legacy: false,
        dual: false,
        version: 5,
        programId: STAKE_PROGRAM_ID_V5,

        poolId: 'D4pYuD4tbir9KBsb7Kr63v9e86JY2UoUZeFK9eHKQFZM',
        poolAuthority: '2T46saTyTYeEFWyesRzLWj6y1ha9ngwcyWyGNn9q4zu4',
        poolLpTokenAccount: 'EV3wsqiMiNcBmo2mFkUuCtib36NpBCsC2vfkW3By1sSu', // lp vault
        poolRewardTokenAccount: '5gEH5Uq2QrqiEhdZ8YFAMY1HoYnKMiuu71f6BC25UXee', // reward vault A
        poolRewardTokenAccountB: 'FTP4hnN5GPtPYvkrscTkKWYVVQ56hV3f4wGgpEXgrDUD' // reward vault B
    },
    {
        name: 'ROPE-USDC',
        lp: { ...LP_TOKENS['ROPE-USDC-V4'] },
        reward: { ...TOKENS.RAY },
        rewardB: { ...TOKENS.ROPE },
        isStake: false,

        fusion: true,
        legacy: false,
        dual: false,
        version: 5,
        programId: STAKE_PROGRAM_ID_V5,

        poolId: 'BLy8KuRck5bcJkQdMDLSZnL1Ka4heAZSGiwTJfEfY727',
        poolAuthority: '8xPzoFPHKWZHWmwKaxFUyVBf2V13HMbCrMDgaCZCLjgx',
        poolLpTokenAccount: 'DiebAVak6cub1Mn3yhhvgSvGhkAP1JTtyRGoAei4wrWE', // lp vault
        poolRewardTokenAccount: '4F9FaFewwsSF8Bsxukyj9NiEdPFQQ38dNKEDpZugYfdi', // reward vault A
        poolRewardTokenAccountB: '4tvLbnZEPZLuDf636DHEzrUxW8bDoZ5XyfVwk7ppDhbC' // reward vault B
    },
    // {
    //     name: 'ALEPH-USDC',
    //     lp: { ...LP_TOKENS['ALEPH-USDC-V4'] },
    //     reward: { ...TOKENS.RAY },
    //     rewardB: { ...TOKENS.ALEPH },
    //     isStake: false,

    //     fusion: true,
    //     legacy: false,
    //     dual: false,
    //     version: 5,
    //     programId: STAKE_PROGRAM_ID_V5,

    //     poolId: 'JAP8SFagJBm6vt2LoFGNeSJ1hKDZ2p3yXb3CvBx11How',
    //     poolAuthority: 'DVtR63sAnJPM9wdt1hYBqA5GTyFzjfcfdLTfsSzV85Ss',
    //     poolLpTokenAccount: 'feCzxSvVX4EboJV4cubjqoPTK41noaHUanz8ZNJmiBp', // lp vault
    //     poolRewardTokenAccount: '4mAhgUY8XGMY4743wuzVbLw7d5bqqTaxME8jmbC2YfH4', // reward vault A
    //     poolRewardTokenAccountB: '3sGDa8ir8GrkKbnBH6HP63JaYSs7nskmmVHpF2vuzaZr' // reward vault B
    // }
]



// {
//     name: 'ROPE-USDC',
//     lp: { ...LP_TOKENS['ROPE-USDC-V4'] },
//     reward: { ...TOKENS.RAY },
//     rewardB: { ...TOKENS.ROPE },
//     isStake: false,

//     fusion: true,
//     legacy: false,
//     dual: false,
//     version: 5,
//     programId: STAKE_PROGRAM_ID_V5,

//     poolId: 'BLy8KuRck5bcJkQdMDLSZnL1Ka4heAZSGiwTJfEfY727',
//     poolAuthority: '8xPzoFPHKWZHWmwKaxFUyVBf2V13HMbCrMDgaCZCLjgx',
//     poolLpTokenAccount: 'DiebAVak6cub1Mn3yhhvgSvGhkAP1JTtyRGoAei4wrWE', // lp vault
//     poolRewardTokenAccount: '4F9FaFewwsSF8Bsxukyj9NiEdPFQQ38dNKEDpZugYfdi', // reward vault A
//     poolRewardTokenAccountB: '4tvLbnZEPZLuDf636DHEzrUxW8bDoZ5XyfVwk7ppDhbC' // reward vault B
// },