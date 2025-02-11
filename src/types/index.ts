import { Content } from "@elizaos/core";
import { Address, Hex } from "viem";

export interface SwapParams extends Content {
    inputTokenCA?: Address;
    inputTokenSymbol?: string;
    outputTokenCA?: Address;
    outputTokenSymbol?: string;
    amount: string;
    slippage?: number;
}

export interface SwapResult {
    hash: Hex;
    inputTokenCA?: Address;
    inputTokenSymbol?: string;
    outputTokenCA?: Address;
    outputTokenSymbol?: string;
    amount: string;
    slippage?: number;
    text?: string;
}

export interface TransferParams extends Content {
    inputTokenCA?: Address;
    inputTokenSymbol?: string;
    amount: string;
    recipient: Address;
}

export interface TransferResult {
    hash: Hex;
    inputTokenCA?: Address;
    inputTokenSymbol?: string;
    amount: string;
    recipient: Address;
}

export interface SendTransactionParams {
    to: Address;
    data: string;
    value?: bigint;
    nonce: number;
}

export interface Item {
    name: string;
    address: Address;
    symbol: string;
    decimals: number;
}

export interface WalletPortfolio {
    items: Array<Item>;
}

export interface PortfolioItem {
    contract_name: string;
    contract_address: string;
    contract_ticker_symbol: string;
    contract_decimals: number;
}

export interface TokenApiItem {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
}

export interface WalletProviderResponse {
    message: string;
    error?: string;
}
