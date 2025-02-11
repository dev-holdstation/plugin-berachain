import {
    type Provider,
    type IAgentRuntime,
    type Memory,
    type State,
    elizaLogger,
} from "@elizaos/core";

import type {
    Item,
    PortfolioItem,
    SendTransactionParams,
    TokenApiItem,
    WalletPortfolio,
    WalletProviderResponse,
} from "../types";

import NodeCache from "node-cache";
import { Address, erc20Abi, Hex } from "viem";
import { ethers, Wallet } from "ethers";

export class WalletProvider {
    private cache: NodeCache;
    private wallet: Wallet;

    constructor(privateKey: string, rpcUrl: string) {
        this.cache = new NodeCache({ stdTTL: 300 });

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new Wallet(privateKey, provider);
    }

    getAddress() {
        return this.wallet.address;
    }

    getNonce() {
        return this.wallet.getNonce();
    }

    async getAllowace(
        tokenAddress: Address,
        spender: Address
    ): Promise<bigint> {
        const erc20Contract = new ethers.Contract(
            tokenAddress,
            erc20Abi,
            this.wallet
        );
        return erc20Contract.allowance(this.getAddress(), spender);
    }

    async approve(
        spenderAddress: Address,
        tokenAddress: Address,
        amount: bigint
    ) {
        const erc20Contract = new ethers.Contract(
            tokenAddress,
            erc20Abi,
            this.wallet
        );
        const tx = await erc20Contract.approve(spenderAddress, amount);
        await tx.wait();
    }

    async sendTransaction(req: SendTransactionParams): Promise<string> {
        const txResp = await this.wallet.sendTransaction(req);
        console.log("sendTransaction txhash:", txResp.hash);
        return txResp.hash;
    }

    async transfer(
        tokenAddress: Address,
        amount: bigint,
        recipient: Address
    ): Promise<Hex> {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            erc20Abi,
            this.wallet
        );
        const nonce = await this.wallet.getNonce();
        const tx = await tokenContract.transfer(recipient, amount, { nonce });
        const receipt = await tx.wait();
        return receipt.hash;
    }

    async fetchPortfolio(): Promise<WalletPortfolio> {
        try {
            const cacheKey = `portfolio-${this.getAddress()}`;
            const cachedValue = this.cache.get<WalletPortfolio>(cacheKey);
            if (cachedValue) {
                elizaLogger.info("Cache hit for fetchPortfolio");
                return cachedValue;
            }
            elizaLogger.info("Cache miss for fetchPortfolio");

            const fetchUrl = `https://api.holdstation.com/api/user-balance/chain/80094/wallet/${this.getAddress()}`;

            const portfolioResp = await fetch(fetchUrl);
            const portfolioData = await portfolioResp.json();
            if (!portfolioData || !portfolioData.success) {
                elizaLogger.error("Failed to fetch portfolio:", portfolioData);
                throw new Error(
                    `Failed to fetch portfolio: ${
                        portfolioData?.error || "Unknown error"
                    }`
                );
            }

            const items: Array<Item> =
                portfolioData.data.map(
                    (item: PortfolioItem): Item => ({
                        name: item.contract_name,
                        address: item.contract_address.startsWith("0x")
                            ? (item.contract_address as `0x${string}`)
                            : (`0x${item.contract_address}` as `0x${string}`),
                        symbol: item.contract_ticker_symbol,
                        decimals: item.contract_decimals,
                    })
                ) || [];
            const portfolio: WalletPortfolio = { items };

            this.cache.set(cacheKey, portfolio);
            return portfolio;
        } catch (error) {
            elizaLogger.error("Error fetching portfolio:", error);
            throw error;
        }
    }

    async fetchAllTokens(): Promise<Array<Item>> {
        try {
            const cacheKey = "all-bera-tokens";
            const cachedValue = this.cache.get<Array<Item>>(cacheKey);
            if (cachedValue) {
                elizaLogger.log("Cache hit for fetch all");
                return cachedValue;
            }
            elizaLogger.log("Cache miss for fetch all");

            const fetchUrl = "https://tokens.coingecko.com/berachain/all.json";

            const tokensResp = await fetch(fetchUrl);
            const tokensData = await tokensResp.json();
            if (!tokensData || tokensData.error || !tokensData.data) {
                elizaLogger.error("Failed to fetch all tokens:", tokensData);
                throw new Error(
                    `Failed to fetch all tokens: ${
                        tokensData?.error || "Unknown error"
                    }`
                );
            }

            const tokens: Array<Item> =
                tokensData.tokens.map(
                    (item: TokenApiItem): Item => ({
                        name: item.name,
                        address: item.address as Address,
                        symbol: item.symbol,
                        decimals: item.decimals,
                    })
                ) || [];

            this.cache.set(cacheKey, tokens);
            return tokens;
        } catch (error) {
            elizaLogger.error("Error fetching all tokens:", error);
            throw error;
        }
    }
}

export const initWalletProvider = async (runtime: IAgentRuntime) => {
    const privateKey = runtime.getSetting("BERACHAIN_PRIVATE_KEY");
    const rpcUrl = runtime.getSetting("BERACHAIN_RPC_URL");

    if (!privateKey || !rpcUrl) {
        throw new Error(
            "BERACHAIN_PRIVATE_KEY OR BERACHAIN_RPC_URL is missing"
        );
    }
    return new WalletProvider(privateKey, rpcUrl);
};

export const walletProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state?: State
    ): Promise<WalletProviderResponse> => {
        try {
            const walletProvider = await initWalletProvider(runtime);
            const agentName = state?.agentName || "The agent";
            return {
                message: `${agentName}'s wallet address: ${walletProvider.getAddress()}`,
            };
        } catch (error) {
            console.error("Error in wallet provider:", error);
            return {
                message: "Failed to get wallet address",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    },
};
