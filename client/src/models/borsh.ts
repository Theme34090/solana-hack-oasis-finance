import * as borsh from 'borsh';

/**
 * The state of a providing liquidity account managed by the hello world program
 */
class ProvideLiquidityAccount {
    instruction: number = 0;
    max_coin_amount: number = 0;
    max_pc_amount: number = 0;
    fixed_from_coin: number = 0;
    constructor(
        fields: {
            instruction: number,
            max_coin_amount: number,
            max_pc_amount: number,
            fixed_from_coin: number,
        } |
            undefined = undefined
    ) {
        if (fields) {
            this.instruction = fields.instruction;
            this.max_coin_amount = fields.max_coin_amount;
            this.max_pc_amount = fields.max_pc_amount;
            this.fixed_from_coin = fields.fixed_from_coin;
        }
    }
}

/**
 * Borsh schema definition for providing liquidity accounts
 */
const ProvideLPSchema = new Map([
    [
        ProvideLiquidityAccount,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['max_coin_amount', 'u64'],
                ['max_pc_amount', 'u64'],
                ['fixed_from_coin', 'u64']
            ]
        }
    ],
]);

export function serializeProvideLP(
    instruction: number,
    max_coin_amount: number,
    max_pc_amount: number,
    fixed_from_coin: number,
): Buffer {
    const account = new ProvideLiquidityAccount({
        instruction,
        max_coin_amount,
        max_pc_amount,
        fixed_from_coin,
    });

    return Buffer.from(
        borsh.serialize(ProvideLPSchema, account)
    );
}