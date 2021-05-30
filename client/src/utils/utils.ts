import { ENV } from "../store/connection";

// import { ENV } from "./connection";

import PopularTokens from "./token-list.json";


export interface KnownToken {
    tokenSymbol: string;
    tokenName: string;
    icon: string;
    mintAddress: string;
}

const AddressToToken = Object.keys(PopularTokens).reduce((map, key) => {
    const tokens = PopularTokens[key as ENV] as KnownToken[];
    const knownMints = tokens.reduce((map, item) => {
        map.set(item.mintAddress, item);
        return map;
    }, new Map<string, KnownToken>());

    map.set(key as ENV, knownMints);

    return map;
}, new Map<ENV, Map<string, KnownToken>>())


// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
    return `0x${address.substring(0, chars)}...${address.substring(44 - chars)}`;
}

export function getTokenName(env: ENV, mintAddress: string): string {
    const knownSymbol = AddressToToken.get(env)?.get(mintAddress)?.tokenSymbol;
    if (knownSymbol) {
        return knownSymbol;
    }

    return shortenAddress(mintAddress).substring(10).toUpperCase();
}

export function getTokenIcon(
    env: ENV,
    mintAddress: string
): string | undefined {
    return AddressToToken.get(env)?.get(mintAddress)?.icon;
}

export function getTokenSymbol(
    env: ENV,
    mintAddress: string
): string | undefined {
    return AddressToToken.get(env)?.get(mintAddress)?.tokenSymbol;
}