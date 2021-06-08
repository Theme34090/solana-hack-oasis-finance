import { Connection, PublicKey } from "@solana/web3.js";
import { LIQUIDITY_POOL_PROGRAM_ID_V4, SERUM_PROGRAM_ID_V3, LIQUIDITY_POOL_PROGRAM_ID_V3, LIQUIDITY_POOL_PROGRAM_ID_V2 } from "../utils/ids";
import { commitment, createAmmAuthority, getFilterProgramAccounts, getMultipleAccounts } from "../utils/web3";

import { OpenOrders, _MARKET_STATE_LAYOUT_V2 } from '@project-serum/serum/lib/market';
// @ts-ignore
import { struct } from 'buffer-layout'
import { publicKey, u64, u128 } from '@project-serum/borsh'
import { LP_TOKENS, NATIVE_SOL, TOKENS } from "../utils/tokens";
import { ACCOUNT_LAYOUT, MINT_LAYOUT } from "../utils/layouts";
import { LiquidityPoolInfo, LIQUIDITY_POOLS } from "../utils/pools";
import { cloneDeep } from "lodash-es";
import { TokenAmount } from "../utils/safe-math";
import { getAddressForWhat } from "../utils/pools";

export async function getLpMintListDecimals(
    conn: any,
    mintAddressInfos: string[]
): Promise<{ [name: string]: number }> {
    const reLpInfoDict: { [name: string]: number } = {}
    const mintList = [] as PublicKey[]
    mintAddressInfos.forEach((item) => {
        let lpInfo = Object.values(LP_TOKENS).find((itemLpToken) => itemLpToken.mintAddress === item)
        if (!lpInfo) {
            mintList.push(new PublicKey(item))
            lpInfo = {
                //@ts-ignore
                decimals: null
            }
        }
        //@ts-ignore
        reLpInfoDict[item] = lpInfo.decimals
    })
    const mintAll = await getMultipleAccounts(conn, mintList, commitment)
    for (let mintIndex = 0; mintIndex < mintAll.length; mintIndex += 1) {
        const itemMint = mintAll[mintIndex]
        if (itemMint) {
            const mintLayoutData = MINT_LAYOUT.decode(Buffer.from(itemMint.account.data))
            reLpInfoDict[mintList[mintIndex].toString()] = mintLayoutData.decimals
        }
    }
    const reInfo: { [name: string]: number } = {}
    for (const key of Object.keys(reLpInfoDict)) {
        if (reLpInfoDict[key] !== null) {
            reInfo[key] = reLpInfoDict[key]
        }
    }
    return reInfo

}

export async function requestInfos(
    conn: Connection,

) {

    const ammAll = await getFilterProgramAccounts(
        conn,
        new PublicKey(LIQUIDITY_POOL_PROGRAM_ID_V2),
        // new PublicKey("9rpQHSyFVM1dkkHFQ2TtTzPEW7DVmEyPmN8wVniqJtuC"),
        [
            {
                dataSize: AMM_INFO_LAYOUT_V4.span
            }
        ],
    );


    const marketAll = await getFilterProgramAccounts(
        conn,
        new PublicKey(SERUM_PROGRAM_ID_V3),
        // new PublicKey("DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY"),
        [
            {
                dataSize: _MARKET_STATE_LAYOUT_V2.span
            }
        ]
    );


    const marketToLayout: { [name: string]: any } = {}
    marketAll.forEach((item) => {
        marketToLayout[item.publicKey.toString()] = _MARKET_STATE_LAYOUT_V2.decode(item.accountInfo.data)
    })


    const lpMintAddressList: string[] = []
    ammAll.forEach((item) => {
        const ammLayout = AMM_INFO_LAYOUT.decode(Buffer.from(item.accountInfo.data))
        if (
            ammLayout.pcMintAddress.toString() === ammLayout.serumMarket.toString() ||
            ammLayout.lpMintAddress.toString() === '11111111111111111111111111111111'
        ) {
            return
        }
        lpMintAddressList.push(ammLayout.lpMintAddress.toString())
    });


    const lpMintListDecimls = await getLpMintListDecimals(conn, lpMintAddressList);



    for (let indexAmmInfo = 0; indexAmmInfo < ammAll.length; indexAmmInfo += 1) {
        const ammInfo = AMM_INFO_LAYOUT.decode(Buffer.from(ammAll[indexAmmInfo].accountInfo.data))
        if (
            !Object.keys(lpMintListDecimls).includes(ammInfo.lpMintAddress.toString()) ||
            ammInfo.pcMintAddress.toString() === ammInfo.serumMarket.toString() ||
            ammInfo.lpMintAddress.toString() === '11111111111111111111111111111111' ||
            !Object.keys(marketToLayout).includes(ammInfo.serumMarket.toString())
        ) {
            continue
        }

        const fromCoin =
            ammInfo.coinMintAddress.toString() === TOKENS.WSOL.mintAddress
                ? NATIVE_SOL.mintAddress
                : ammInfo.coinMintAddress.toString();

        const toCoin =
            ammInfo.pcMintAddress.toString() === TOKENS.WSOL.mintAddress
                ? NATIVE_SOL.mintAddress
                : ammInfo.pcMintAddress.toString();

        let coin = Object.values(TOKENS).find((item) => item.mintAddress === fromCoin);

        if (!coin) {
            TOKENS[`unknow-${ammInfo.coinMintAddress.toString()}`] = {
                symbol: 'unknown',
                name: 'unknown',
                mintAddress: ammInfo.coinMintAddress.toString(),
                decimals: ammInfo.coinDecimals.toNumber(),
                official: false
            }
            coin = TOKENS[`unknow-${ammInfo.coinMintAddress.toString()}`]
        }

        let pc = Object.values(TOKENS).find((item) => item.mintAddress === toCoin)
        if (!pc) {
            TOKENS[`unknow-${ammInfo.pcMintAddress.toString()}`] = {
                symbol: 'unknown',
                name: 'unknown',
                mintAddress: ammInfo.pcMintAddress.toString(),
                decimals: ammInfo.pcDecimals.toNumber(),
                official: false
            }
            pc = TOKENS[`unknow-${ammInfo.pcMintAddress.toString()}`]
        }

        if (coin.mintAddress === TOKENS.WSOL.mintAddress) {
            coin.symbol = 'SOL'
            coin.name = 'SOL'
            coin.mintAddress = '11111111111111111111111111111111'
        }

        if (pc.mintAddress === TOKENS.WSOL.mintAddress) {
            pc.symbol = 'SOL'
            pc.name = 'SOL'
            pc.mintAddress = '11111111111111111111111111111111'
        }

        const lp = Object.values(LP_TOKENS).find((item) => item.mintAddress === ammInfo.lpMintAddress) ?? {
            symbol: `${coin.name}-${pc.name}`,
            name: `${coin.name}-${pc.name}`,
            coin,
            pc,
            mintAddress: ammInfo.lpMintAddress.toString(),
            decimals: lpMintListDecimls[ammInfo.lpMintAddress]
        }

        const { publicKey } = await createAmmAuthority(new PublicKey(LIQUIDITY_POOL_PROGRAM_ID_V4))

        const market = marketToLayout[ammInfo.serumMarket]

        const serumVaultSigner = await PublicKey.createProgramAddress(
            [ammInfo.serumMarket.toBuffer(), market.vaultSignerNonce.toArrayLike(Buffer, 'le', 8)],
            new PublicKey(SERUM_PROGRAM_ID_V3)
        )

        const itemLiquidity: LiquidityPoolInfo = {
            name: `${coin.symbol}-${pc.name}`,
            coin,
            pc,
            lp,
            version: 4,
            programId: LIQUIDITY_POOL_PROGRAM_ID_V4,
            ammId: ammAll[indexAmmInfo].publicKey.toString(),
            ammAuthority: publicKey.toString(),
            ammOpenOrders: ammInfo.ammOpenOrders.toString(),
            ammTargetOrders: ammInfo.ammTargetOrders.toString(),
            ammQuantities: NATIVE_SOL.mintAddress,
            poolCoinTokenAccount: ammInfo.poolCoinTokenAccount.toString(),
            poolPcTokenAccount: ammInfo.poolPcTokenAccount.toString(),
            poolWithdrawQueue: ammInfo.poolWithdrawQueue.toString(),
            poolTempLpTokenAccount: ammInfo.poolTempLpTokenAccount.toString(),
            serumProgramId: SERUM_PROGRAM_ID_V3,
            serumMarket: ammInfo.serumMarket.toString(),
            serumBids: market.bids.toString(),
            serumAsks: market.asks.toString(),
            serumEventQueue: market.eventQueue.toString(),
            serumCoinVaultAccount: market.baseVault.toString(),
            serumPcVaultAccount: market.quoteVault.toString(),
            serumVaultSigner: serumVaultSigner.toString(),
            official: false
        }
        if (!LIQUIDITY_POOLS.find((item) => item.ammId === itemLiquidity.ammId)) {
            console.log(
                'official false',
                itemLiquidity.name,
                itemLiquidity.ammId,
                itemLiquidity.serumMarket
                // itemLiquidity.ammId,
                // lp.mintAddress,
                // itemLiquidity,
                // itemLiquidity.serumMarket,
                // itemLiquidity.ammId,
                // LIQUIDITY_POOLS.length
            )
            LIQUIDITY_POOLS.push(itemLiquidity)
        } else {
            for (let itemIndex = 0; itemIndex < LIQUIDITY_POOLS.length; itemIndex += 1) {
                if (
                    LIQUIDITY_POOLS[itemIndex].ammId === itemLiquidity.ammId &&
                    LIQUIDITY_POOLS[itemIndex].name !== itemLiquidity.name &&
                    !LIQUIDITY_POOLS[itemIndex].official
                ) {
                    LIQUIDITY_POOLS[itemIndex] = itemLiquidity
                }
            }
        }
    }


    const liquidityPools = {} as any
    const publicKeys = [] as any

    LIQUIDITY_POOLS.forEach((pool) => {
        const { poolCoinTokenAccount, poolPcTokenAccount, ammOpenOrders, ammId, coin, pc, lp } = pool

        publicKeys.push(
            new PublicKey(poolCoinTokenAccount),
            new PublicKey(poolPcTokenAccount),
            new PublicKey(ammOpenOrders),
            new PublicKey(ammId),
            new PublicKey(lp.mintAddress)
        )

        const poolInfo = cloneDeep(pool)

        poolInfo.coin.balance = new TokenAmount(0, coin.decimals)
        poolInfo.pc.balance = new TokenAmount(0, pc.decimals)

        liquidityPools[lp.mintAddress] = poolInfo
    })

    const multipleInfo = await getMultipleAccounts(conn, publicKeys, commitment)

    multipleInfo.forEach((info) => {
        if (info) {
            const address = info.publicKey.toBase58()
            const data = Buffer.from(info.account.data)

            const { key, lpMintAddress, version } = getAddressForWhat(address)

            if (key && lpMintAddress) {
                const poolInfo = liquidityPools[lpMintAddress]

                switch (key) {
                    case 'poolCoinTokenAccount': {
                        const parsed = ACCOUNT_LAYOUT.decode(data)
                        // quick fix: Number can only safely store up to 53 bits
                        poolInfo.coin.balance.wei = poolInfo.coin.balance.wei.plus(parsed.amount.toString())

                        break
                    }
                    case 'poolPcTokenAccount': {
                        const parsed = ACCOUNT_LAYOUT.decode(data)

                        poolInfo.pc.balance.wei = poolInfo.pc.balance.wei.plus(parsed.amount.toNumber())

                        break
                    }
                    case 'ammOpenOrders': {
                        const OPEN_ORDERS_LAYOUT = OpenOrders.getLayout(new PublicKey(poolInfo.serumProgramId))
                        const parsed = OPEN_ORDERS_LAYOUT.decode(data)

                        const { baseTokenTotal, quoteTokenTotal } = parsed
                        poolInfo.coin.balance.wei = poolInfo.coin.balance.wei.plus(baseTokenTotal.toNumber())
                        poolInfo.pc.balance.wei = poolInfo.pc.balance.wei.plus(quoteTokenTotal.toNumber())

                        break
                    }
                    case 'ammId': {
                        let parsed
                        if (version === 2) {
                            parsed = AMM_INFO_LAYOUT.decode(data)
                        } else if (version === 3) {
                            parsed = AMM_INFO_LAYOUT_V3.decode(data)
                        } else {
                            parsed = AMM_INFO_LAYOUT_V4.decode(data)

                            const { swapFeeNumerator, swapFeeDenominator } = parsed
                            poolInfo.fees = {
                                swapFeeNumerator: swapFeeNumerator.toNumber(),
                                swapFeeDenominator: swapFeeDenominator.toNumber()
                            }
                        }

                        const { status, needTakePnlCoin, needTakePnlPc } = parsed
                        poolInfo.status = status.toNumber()
                        poolInfo.coin.balance.wei = poolInfo.coin.balance.wei.minus(needTakePnlCoin.toNumber())
                        poolInfo.pc.balance.wei = poolInfo.pc.balance.wei.minus(needTakePnlPc.toNumber())

                        break
                    }
                    // getLpSupply
                    case 'lpMintAddress': {
                        const parsed = MINT_LAYOUT.decode(data)

                        poolInfo.lp.totalSupply = new TokenAmount(parsed.supply.toNumber(), poolInfo.lp.decimals)

                        break
                    }
                }
            }
        }
    })

    return liquidityPools;
}



export const AMM_INFO_LAYOUT = struct([
    u64('status'),
    u64('nonce'),
    u64('orderNum'),
    u64('depth'),
    u64('coinDecimals'),
    u64('pcDecimals'),
    u64('state'),
    u64('resetFlag'),
    u64('fee'),
    u64('minSize'),
    u64('volMaxCutRatio'),
    u64('pnlRatio'),
    u64('amountWaveRatio'),
    u64('coinLotSize'),
    u64('pcLotSize'),
    u64('minPriceMultiplier'),
    u64('maxPriceMultiplier'),
    u64('needTakePnlCoin'),
    u64('needTakePnlPc'),
    u64('totalPnlX'),
    u64('totalPnlY'),
    u64('systemDecimalsValue'),
    publicKey('poolCoinTokenAccount'),
    publicKey('poolPcTokenAccount'),
    publicKey('coinMintAddress'),
    publicKey('pcMintAddress'),
    publicKey('lpMintAddress'),
    publicKey('ammOpenOrders'),
    publicKey('serumMarket'),
    publicKey('serumProgramId'),
    publicKey('ammTargetOrders'),
    publicKey('ammQuantities'),
    publicKey('poolWithdrawQueue'),
    publicKey('poolTempLpTokenAccount'),
    publicKey('ammOwner'),
    publicKey('pnlOwner')
])



export const AMM_INFO_LAYOUT_V3 = struct([
    u64('status'),
    u64('nonce'),
    u64('orderNum'),
    u64('depth'),
    u64('coinDecimals'),
    u64('pcDecimals'),
    u64('state'),
    u64('resetFlag'),
    u64('fee'),
    u64('min_separate'),
    u64('minSize'),
    u64('volMaxCutRatio'),
    u64('pnlRatio'),
    u64('amountWaveRatio'),
    u64('coinLotSize'),
    u64('pcLotSize'),
    u64('minPriceMultiplier'),
    u64('maxPriceMultiplier'),
    u64('needTakePnlCoin'),
    u64('needTakePnlPc'),
    u64('totalPnlX'),
    u64('totalPnlY'),
    u64('systemDecimalsValue'),
    publicKey('poolCoinTokenAccount'),
    publicKey('poolPcTokenAccount'),
    publicKey('coinMintAddress'),
    publicKey('pcMintAddress'),
    publicKey('lpMintAddress'),
    publicKey('ammOpenOrders'),
    publicKey('serumMarket'),
    publicKey('serumProgramId'),
    publicKey('ammTargetOrders'),
    publicKey('ammQuantities'),
    publicKey('poolWithdrawQueue'),
    publicKey('poolTempLpTokenAccount'),
    publicKey('ammOwner'),
    publicKey('pnlOwner'),
    publicKey('srmTokenAccount')
])

export const AMM_INFO_LAYOUT_V4 = struct([
    u64('status'),
    u64('nonce'),
    u64('orderNum'),
    u64('depth'),
    u64('coinDecimals'),
    u64('pcDecimals'),
    u64('state'),
    u64('resetFlag'),
    u64('minSize'),
    u64('volMaxCutRatio'),
    u64('amountWaveRatio'),
    u64('coinLotSize'),
    u64('pcLotSize'),
    u64('minPriceMultiplier'),
    u64('maxPriceMultiplier'),
    u64('systemDecimalsValue'),
    // Fees
    u64('minSeparateNumerator'),
    u64('minSeparateDenominator'),
    u64('tradeFeeNumerator'),
    u64('tradeFeeDenominator'),
    u64('pnlNumerator'),
    u64('pnlDenominator'),
    u64('swapFeeNumerator'),
    u64('swapFeeDenominator'),
    // OutPutData
    u64('needTakePnlCoin'),
    u64('needTakePnlPc'),
    u64('totalPnlPc'),
    u64('totalPnlCoin'),
    u128('poolTotalDepositPc'),
    u128('poolTotalDepositCoin'),
    u128('swapCoinInAmount'),
    u128('swapPcOutAmount'),
    u64('swapCoin2PcFee'),
    u128('swapPcInAmount'),
    u128('swapCoinOutAmount'),
    u64('swapPc2CoinFee'),

    publicKey('poolCoinTokenAccount'),
    publicKey('poolPcTokenAccount'),
    publicKey('coinMintAddress'),
    publicKey('pcMintAddress'),
    publicKey('lpMintAddress'),
    publicKey('ammOpenOrders'),
    publicKey('serumMarket'),
    publicKey('serumProgramId'),
    publicKey('ammTargetOrders'),
    publicKey('poolWithdrawQueue'),
    publicKey('poolTempLpTokenAccount'),
    publicKey('ammOwner'),
    publicKey('pnlOwner')
])