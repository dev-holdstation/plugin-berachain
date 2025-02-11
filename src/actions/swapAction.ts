import {
    type Action,
    type IAgentRuntime,
    type Memory,
    type HandlerCallback,
    type State,
    composeContext,
    ModelClass,
    elizaLogger,
    type ActionExample,
    generateObjectDeprecated,
} from "@elizaos/core";

import { swapTemplate } from "../templates";
import type { SendTransactionParams, SwapParams, SwapResult } from "../types";
import {
    initWalletProvider,
    type WalletProvider,
} from "../providers/walletProvider";
import { validateBerachainConfig } from "../environment";
import { HOLDSTATION_ROUTER_ADDRESS, NATIVE_ADDRESS } from "../constants";
import { parseUnits, type Hex } from "viem";

// ------------------------------------------------------------------------------------------------
// Core Action Class
// ------------------------------------------------------------------------------------------------
export class SwapAction {
    constructor(private walletProvider: WalletProvider) {}

    async swap(params: SwapParams): Promise<SwapResult> {
        const { items: tokens } = await this.walletProvider.fetchPortfolio();

        if (!params.inputTokenCA && !params.inputTokenSymbol) {
            throw new Error("Input token not provided");
        }

        const filters = tokens.filter((t) => {
            return params.inputTokenCA
                ? t.address === params.inputTokenCA
                : t.symbol === params.inputTokenSymbol?.toUpperCase();
        });
        if (filters.length !== 1) {
            throw new Error(
                "Multiple tokens or no tokens found with the symbol"
            );
        }

        // fill in token info
        params.inputTokenCA = filters[0].address;
        params.inputTokenSymbol = filters[0].symbol;
        const decimals = filters[0].decimals ?? 18;

        // parse amount out
        const tokenAmount = parseUnits(params.amount, decimals);

        if (!params.outputTokenCA && !params.outputTokenSymbol) {
            throw new Error("Output token not provided");
        }

        if (!params.outputTokenCA || !params.outputTokenSymbol) {
            const tokens = await this.walletProvider.fetchAllTokens();
            const filters = tokens.filter((t) => {
                return params.outputTokenCA
                    ? t.address === params.outputTokenCA
                    : t.symbol === params.outputTokenSymbol?.toUpperCase();
            });
            if (filters.length !== 1) {
                throw new Error(
                    "Multiple tokens or no tokens found with the symbol"
                );
            }
            params.outputTokenCA = filters[0].address;
            params.outputTokenSymbol = filters[0].symbol;
        }

        elizaLogger.info("--- Swap params:", params, tokenAmount);

        // fetch swap tx data
        const walletAddress = this.walletProvider.getAddress();
        const deadline = Math.floor(Date.now() / 1000) + 10 * 60;
        const swapUrl = `https://swap.hold.so/berachain/api/swap?src=${params.inputTokenCA}&dst=${params.outputTokenCA}&amount=${tokenAmount}&receiver=${walletAddress}&deadline=${deadline}`;
        elizaLogger.info("swapUrl:", swapUrl);
        const swapResponse = await fetch(swapUrl);
        const swapData = await swapResponse.json();
        if (!swapData || swapData.error) {
            elizaLogger.error("Swap error:", swapData);
            throw new Error(
                `Failed to fetch swap: ${swapData?.error || "Unknown error"}`
            );
        }

        // generate nonce
        const nonce = await this.walletProvider.getNonce();

        const populatedTx: SendTransactionParams = {
            to: HOLDSTATION_ROUTER_ADDRESS,
            data: swapData.tx.data,
            nonce: nonce,
        };

        if (
            params.inputTokenCA.toLowerCase() !== NATIVE_ADDRESS.toLowerCase()
        ) {
            const allowance = await this.walletProvider.getAllowace(
                params.inputTokenCA,
                HOLDSTATION_ROUTER_ADDRESS
            );
            if (allowance < tokenAmount) {
                await this.walletProvider.approve(
                    HOLDSTATION_ROUTER_ADDRESS,
                    params.inputTokenCA,
                    tokenAmount
                );
            }
        } else {
            populatedTx.value = tokenAmount;
        }

        const hash = await this.walletProvider.sendTransaction(populatedTx);

        return {
            hash: hash as Hex,
            ...params,
        };
    }
}

// ------------------------------------------------------------------------------------------------
// Core Action Implementation
// ------------------------------------------------------------------------------------------------
export const swapAction: Action = {
    name: "TOKEN_SWAP",
    description: "Perform swapping of tokens on Berachain by HoldStation swap.",
    similes: [
        "SWAP_TOKEN",
        "TOKEN_SWAP_ON_BERACHAIN",
        "EXCHANGE_TOKENS",
        "EXCHANGE_TOKENS_ON_BERACHAIN",
        "CONVERT_TOKENS",
        "CONVERT_TOKENS_ON_BERACHAIN",
    ],
    validate: async (
        runtime: IAgentRuntime,
        _message: Memory
    ): Promise<boolean> => {
        await validateBerachainConfig(runtime);
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: Record<string, unknown>,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting Berachain TOKEN_SWAP handler...");

        const walletProvider = await initWalletProvider(runtime);
        const action = new SwapAction(walletProvider);

        // Initialize or update state
        let currentState =
            state ?? ((await runtime.composeState(message)) as State);
        if (state) {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        // compose swap context
        const swapContext = composeContext({
            state: currentState,
            template: swapTemplate,
        });

        // generate swap content
        const content = await generateObjectDeprecated({
            runtime,
            context: swapContext,
            modelClass: ModelClass.SMALL,
        });

        elizaLogger.info("generate swap content:", content);

        try {
            const {
                hash,
                inputTokenCA,
                inputTokenSymbol,
                outputTokenCA,
                outputTokenSymbol,
                amount,
            } = await action.swap(content);

            const successMessage = `Swap completed successfully from ${amount} ${inputTokenSymbol} (${inputTokenCA}) to ${outputTokenSymbol} (${outputTokenCA})!\nTransaction Hash: ${hash}`;
            elizaLogger.success(successMessage);

            callback?.({
                text: successMessage,
                content: {
                    success: true,
                    hash: hash,
                },
            });

            return true;
        } catch (error) {
            elizaLogger.error("Error during token swap:", error);
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

            callback?.({
                text: `Error during token swap: ${errorMessage}`,
                content: { error: errorMessage },
            });

            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Swap 100 USDC for BERA",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Sure, I'll do swap 100 USDC for BERA now.",
                    action: "TOKEN_SWAP",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Swap completed 100 USDC for BERA successfully! Transaction: ...",
                },
            },
        ],
    ] as ActionExample[][],
};
