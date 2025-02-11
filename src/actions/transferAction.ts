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

import { transferTemplate } from "../templates";
import type {
    SendTransactionParams,
    TransferParams,
    TransferResult,
} from "../types";
import {
    initWalletProvider,
    type WalletProvider,
} from "../providers/walletProvider";
import { validateBerachainConfig } from "../environment";
import { Hex, isAddress, parseUnits } from "viem";
import { NATIVE_ADDRESS } from "../constants";

export class TransferAction {
    constructor(private walletProvider: WalletProvider) {}

    async transfer(params: TransferParams): Promise<TransferResult> {
        const { items: tokens } = await this.walletProvider.fetchPortfolio();

        if (!params.inputTokenCA && !params.inputTokenSymbol) {
            throw new Error("Input token not provided");
        }

        if (!isAddress(params.recipient)) {
            throw new Error("Invalid recipient address");
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

        elizaLogger.info("--- Transfer params:", params, tokenAmount);

        let hash: Hex;
        if (params.inputTokenCA != NATIVE_ADDRESS) {
            hash = await this.walletProvider.transfer(
                params.inputTokenCA,
                tokenAmount,
                params.recipient
            );
        } else {
            hash = (await this.walletProvider.sendTransaction({
                to: params.recipient,
                value: tokenAmount,
                nonce: await this.walletProvider.getNonce(),
            } as SendTransactionParams)) as Hex;
        }

        return {
            hash,
            ...params,
        };
    }
}

export const transferAction: Action = {
    name: "TOKEN_TRANSFER",
    description: "Perform transfering tokens on Berachain.",
    similes: [
        "TRANSFER_TOKEN",
        "TOKEN_TRANSFER_ON_BERACHAIN",
        "SEND_TOKENS",
        "SEND_TOKENS_ON_BERACHAIN",
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
        elizaLogger.log("Starting Berachain TOKEN_TRANSFER handler...");

        const walletProvider = await initWalletProvider(runtime);
        const action = new TransferAction(walletProvider);

        // Initialize or update state
        let currentState =
            state ?? ((await runtime.composeState(message)) as State);
        if (state) {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        // compose transfer context
        const transferContext = composeContext({
            state: currentState,
            template: transferTemplate,
        });

        // generate transfer content
        const content = await generateObjectDeprecated({
            runtime,
            context: transferContext,
            modelClass: ModelClass.SMALL,
        });

        elizaLogger.info("generate transfer content:", content);

        try {
            const { hash, inputTokenCA, inputTokenSymbol, amount, recipient } =
                await action.transfer(content);

            const successMessage = `Transfer completed successfully ${amount} ${inputTokenSymbol} (${inputTokenCA}) to address ${recipient}!\nTransaction Hash: ${hash}`;
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
            elizaLogger.error("Error during token transfer:", error);
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

            callback?.({
                text: `Error during token transfer: ${errorMessage}`,
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
                    text: "Send 1 BERA to 0x708a4472eD832c54a76b30Ae247c33dDa1BF3785",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Sure, I'll do send 1 BERA to 0x708a4472eD832c54a76b30Ae247c33dDa1BF3785 now.",
                    action: "TOKEN_TRANSFER",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Transfer completed 1 BERA to 0x708a4472eD832c54a76b30Ae247c33dDa1BF3785 successfully! Transaction: ...",
                },
            },
        ],
    ] as ActionExample[][],
};
