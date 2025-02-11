import { Plugin } from "@elizaos/core";
import { swapAction } from "./actions/swapAction";
import { transferAction } from "./actions/transferAction";

export const berachainPlugin: Plugin = {
    name: "berachain",
    description: "Berachain Plugin for Eliza",
    actions: [swapAction, transferAction],
    providers: [],
    evaluators: [],
};

export default berachainPlugin;
