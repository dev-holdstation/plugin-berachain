import { type IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const berachainEnvSchema = z.object({
    BERACHAIN_PRIVATE_KEY: z
        .string()
        .min(1, "berachain plugin requires private key"),
    BERACHAIN_RPC_URL: z.string().min(1, "berachain plugin requires rpc url"),
});

export type berachainConfig = z.infer<typeof berachainEnvSchema>;

export async function validateBerachainConfig(
    runtime: IAgentRuntime
): Promise<berachainConfig> {
    try {
        const config = {
            BERACHAIN_PRIVATE_KEY:
                runtime.getSetting("BERACHAIN_PRIVATE_KEY") ||
                process.env.BERACHAIN_PRIVATE_KEY,
            BERACHAIN_RPC_URL:
                runtime.getSetting("BERACHAIN_RPC_URL") ||
                process.env.BERACHAIN_RPC_URL,
        };
        return berachainEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(errorMessages);
        }
        throw error;
    }
}
