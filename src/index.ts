import { Plugin } from "@elizaos/core";
import { swapAction } from "./actions/swapAction";

export const berachainPlugin: Plugin = {
    name: "berachain",
    description: "Berachain Plugin for Eliza",
    actions: [swapAction],
    providers: [],
    evaluators: [],
};

export default berachainPlugin;
