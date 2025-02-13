// src/actions/swapAction.ts
import {
  composeContext,
  ModelClass,
  elizaLogger as elizaLogger2,
  generateObjectDeprecated
} from "@elizaos/core";

// src/templates/swapTemplate.ts
var swapTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

Here are several frequently used addresses. Use these for the corresponding tokens:
- BERA/bera: 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
- ETH/eth: 0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590
- USDCe/usdc.e: 0x549943e04f40284185054145c6E4e9568C1D3241
- HOLD/hold: 0xFF0a636Dfc44Bb0129b631cDd38D21B613290c98
- HONEY/honey: 0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce

Example response:
\`\`\`json
{
    "inputTokenSymbol": "HOLD",
    "outputTokenSymbol": "BERA",
    "inputTokenCA": "0xFF0a636Dfc44Bb0129b631cDd38D21B613290c98",
    "outputTokenCA": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "amount": "50",
    "slippage": "0.005"
}
\`\`\`

{{recentMessages}}

Given the recent messages and wallet information below:

{{account}}

Extract the following information about the requested token swap:
- Input token symbol (the token being sold)
- Output token symbol (the token being bought)
- Input token contract address
- Output token contract address
- Amount to swap
- Slippage tolerance (optional, default 0.005 if not specified)

**Validation Details**:
1. **Amount**:
   - Verify the amount is a valid numeric string.

2. **Input and Output Tokens**:
   - Verify that atleast one of the symbol or contract address is provided for both input and output tokens.

3. **Slippage**:
   - If the user does not specify, use the default value of 0.5%.

**Example Scenarios**:
1. User says, "Swap 1 HOLD for BERA":
   - Input token symbol: HOLD
   - Output token symbol: BERA
   - Input token contract address: null
   - Output token contract address: null
   - Amount to swap: 1
   - Slippage: null (default will apply)

2. User says, "Swap 4 USDCe to BERA (0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee) with 1% slippage":
   - Input token symbol: USDCe
   - Output token symbol: BERA
   - Input token contract address: null
   - Output token contract address: 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
   - Amount to swap: 4
   - Slippage: 0.01

3. User says, "Swap 1 token CA 0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590 to BERA with 0.5% slippage":
    - Input token symbol: null
    - Output token symbol: BERA
    - Input token contract address: 0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590
    - Output token contract address: null
    - Amount to swap: 1
    - Slippage: 0.005

Now, process the user's request and provide the JSON response.`;

// src/templates/transferTemplate.ts
var transferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

Here are several frequently used addresses. Use these for the corresponding tokens:
- BERA/bera: 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
- ETH/eth: 0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590
- USDCe/usdc.e: 0x549943e04f40284185054145c6E4e9568C1D3241
- HOLD/hold: 0xFF0a636Dfc44Bb0129b631cDd38D21B613290c98
- HONEY/honey: 0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce

Example response:
\`\`\`json
{
    "inputTokenSymbol": "HOLD",
    "inputTokenCA": "0xFF0a636Dfc44Bb0129b631cDd38D21B613290c98",
    "amount": "50",
    "recipient": "0x708a4472eD832c54a76b30Ae247c33dDa1BF3785"
}
\`\`\`

{{recentMessages}}

Given the recent messages and wallet information below:

{{account}}

Extract the following information about the requested token swap:
- Input token symbol (the token being transferred)
- Input token contract address
- Amount to transfer
- Recipient address (the address to receive the tokens) 

**Validation Details**:
1. **Amount**:
   - Verify the amount is a valid numeric string.

2. **Input Tokens**:
   - Verify that atleast one of the symbol or contract address is provided.

3. **Recipient Address**:
   - Verify that the recipient address is a valid Ethereum address.

**Example Scenarios**:
1. User says, "Send 1 HOLD to address 0x708a4472eD832c54a76b30Ae247c33dDa1BF3785":
   - Input token symbol: HOLD
   - Input token contract address: null
   - Amount to transfer: 1
   - Recipient address: 0x708a4472eD832c54a76b30Ae247c33dDa1BF3785

2. User says, "Transfer 50 BERA (0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee) to address 0x708a4472eD832c54a76b30Ae247c33dDa1BF3785":
   - Input token symbol: BERA
   - Input token contract address: 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
   - Amount to transfer: 50
   - Recipient address: 0x708a4472eD832c54a76b30Ae247c33dDa1BF3785

Now, process the user's request and provide the JSON response.`;

// src/providers/walletProvider.ts
import {
  elizaLogger
} from "@elizaos/core";
import NodeCache from "node-cache";
import { erc20Abi } from "viem";
import { ethers, Wallet } from "ethers";
var WalletProvider = class {
  cache;
  wallet;
  constructor(privateKey, rpcUrl) {
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
  async getAllowace(tokenAddress, spender) {
    const erc20Contract = new ethers.Contract(
      tokenAddress,
      erc20Abi,
      this.wallet
    );
    return erc20Contract.allowance(this.getAddress(), spender);
  }
  async approve(spenderAddress, tokenAddress, amount) {
    const erc20Contract = new ethers.Contract(
      tokenAddress,
      erc20Abi,
      this.wallet
    );
    const tx = await erc20Contract.approve(spenderAddress, amount);
    await tx.wait();
  }
  async sendTransaction(req) {
    const txResp = await this.wallet.sendTransaction(req);
    console.log("sendTransaction txhash:", txResp.hash);
    return txResp.hash;
  }
  async transfer(tokenAddress, amount, recipient) {
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
  async fetchPortfolio() {
    try {
      const cacheKey = `portfolio-${this.getAddress()}`;
      const cachedValue = this.cache.get(cacheKey);
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
          `Failed to fetch portfolio: ${(portfolioData == null ? void 0 : portfolioData.error) || "Unknown error"}`
        );
      }
      const items = portfolioData.data.map(
        (item) => ({
          name: item.contract_name,
          address: item.contract_address.startsWith("0x") ? item.contract_address : `0x${item.contract_address}`,
          symbol: item.contract_ticker_symbol,
          decimals: item.contract_decimals
        })
      ) || [];
      const portfolio = { items };
      this.cache.set(cacheKey, portfolio);
      return portfolio;
    } catch (error) {
      elizaLogger.error("Error fetching portfolio:", error);
      throw error;
    }
  }
  async fetchAllTokens() {
    try {
      const cacheKey = "all-bera-tokens";
      const cachedValue = this.cache.get(cacheKey);
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
          `Failed to fetch all tokens: ${(tokensData == null ? void 0 : tokensData.error) || "Unknown error"}`
        );
      }
      const tokens = tokensData.tokens.map(
        (item) => ({
          name: item.name,
          address: item.address,
          symbol: item.symbol,
          decimals: item.decimals
        })
      ) || [];
      this.cache.set(cacheKey, tokens);
      return tokens;
    } catch (error) {
      elizaLogger.error("Error fetching all tokens:", error);
      throw error;
    }
  }
};
var initWalletProvider = async (runtime) => {
  const privateKey = runtime.getSetting("BERACHAIN_PRIVATE_KEY");
  const rpcUrl = runtime.getSetting("BERACHAIN_RPC_URL");
  if (!privateKey || !rpcUrl) {
    throw new Error(
      "BERACHAIN_PRIVATE_KEY OR BERACHAIN_RPC_URL is missing"
    );
  }
  return new WalletProvider(privateKey, rpcUrl);
};

// src/environment.ts
import { z } from "zod";
var berachainEnvSchema = z.object({
  BERACHAIN_PRIVATE_KEY: z.string().min(1, "berachain plugin requires private key"),
  BERACHAIN_RPC_URL: z.string().min(1, "berachain plugin requires rpc url")
});
async function validateBerachainConfig(runtime) {
  try {
    const config = {
      BERACHAIN_PRIVATE_KEY: runtime.getSetting("BERACHAIN_PRIVATE_KEY") || process.env.BERACHAIN_PRIVATE_KEY,
      BERACHAIN_RPC_URL: runtime.getSetting("BERACHAIN_RPC_URL") || process.env.BERACHAIN_RPC_URL
    };
    return berachainEnvSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n");
      throw new Error(errorMessages);
    }
    throw error;
  }
}

// src/constants/index.ts
var HOLDSTATION_ROUTER_ADDRESS = "0x7d55d31adfde09f48d35cfca13c08a31ebc790cb";
var NATIVE_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

// src/actions/swapAction.ts
import { parseUnits } from "viem";
var SwapAction = class {
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  async swap(params) {
    const { items: tokens } = await this.walletProvider.fetchPortfolio();
    if (!params.inputTokenCA && !params.inputTokenSymbol) {
      throw new Error("Input token not provided");
    }
    const filters = tokens.filter((t) => {
      var _a;
      return params.inputTokenCA ? t.address === params.inputTokenCA : t.symbol === ((_a = params.inputTokenSymbol) == null ? void 0 : _a.toUpperCase());
    });
    if (filters.length !== 1) {
      throw new Error(
        "Multiple tokens or no tokens found with the symbol"
      );
    }
    params.inputTokenCA = filters[0].address;
    params.inputTokenSymbol = filters[0].symbol;
    const decimals = filters[0].decimals ?? 18;
    const tokenAmount = parseUnits(params.amount, decimals);
    if (!params.outputTokenCA && !params.outputTokenSymbol) {
      throw new Error("Output token not provided");
    }
    if (!params.outputTokenCA || !params.outputTokenSymbol) {
      const tokens2 = await this.walletProvider.fetchAllTokens();
      const filters2 = tokens2.filter((t) => {
        var _a;
        return params.outputTokenCA ? t.address === params.outputTokenCA : t.symbol === ((_a = params.outputTokenSymbol) == null ? void 0 : _a.toUpperCase());
      });
      if (filters2.length !== 1) {
        throw new Error(
          "Multiple tokens or no tokens found with the symbol"
        );
      }
      params.outputTokenCA = filters2[0].address;
      params.outputTokenSymbol = filters2[0].symbol;
    }
    elizaLogger2.info("--- Swap params:", params, tokenAmount);
    const walletAddress = this.walletProvider.getAddress();
    const deadline = Math.floor(Date.now() / 1e3) + 10 * 60;
    const swapUrl = `https://swap.hold.so/berachain/api/swap?src=${params.inputTokenCA}&dst=${params.outputTokenCA}&amount=${tokenAmount}&receiver=${walletAddress}&deadline=${deadline}`;
    elizaLogger2.info("swapUrl:", swapUrl);
    const swapResponse = await fetch(swapUrl);
    const swapData = await swapResponse.json();
    if (!swapData || swapData.error) {
      elizaLogger2.error("Swap error:", swapData);
      throw new Error(
        `Failed to fetch swap: ${(swapData == null ? void 0 : swapData.error) || "Unknown error"}`
      );
    }
    const nonce = await this.walletProvider.getNonce();
    const populatedTx = {
      to: HOLDSTATION_ROUTER_ADDRESS,
      data: swapData.tx.data,
      nonce
    };
    if (params.inputTokenCA.toLowerCase() !== NATIVE_ADDRESS.toLowerCase()) {
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
      hash,
      ...params
    };
  }
};
var swapAction = {
  name: "TOKEN_SWAP",
  description: "Perform swapping of tokens on Berachain by HoldStation swap.",
  similes: [
    "SWAP_TOKEN",
    "TOKEN_SWAP_ON_BERACHAIN",
    "EXCHANGE_TOKENS",
    "EXCHANGE_TOKENS_ON_BERACHAIN",
    "CONVERT_TOKENS",
    "CONVERT_TOKENS_ON_BERACHAIN"
  ],
  validate: async (runtime, _message) => {
    await validateBerachainConfig(runtime);
    return true;
  },
  handler: async (runtime, message, state, _options, callback) => {
    elizaLogger2.log("Starting Berachain TOKEN_SWAP handler...");
    const walletProvider = await initWalletProvider(runtime);
    const action = new SwapAction(walletProvider);
    let currentState = state ?? await runtime.composeState(message);
    if (state) {
      currentState = await runtime.updateRecentMessageState(currentState);
    }
    const swapContext = composeContext({
      state: currentState,
      template: swapTemplate
    });
    const content = await generateObjectDeprecated({
      runtime,
      context: swapContext,
      modelClass: ModelClass.SMALL
    });
    elizaLogger2.info("generate swap content:", content);
    try {
      const {
        hash,
        inputTokenCA,
        inputTokenSymbol,
        outputTokenCA,
        outputTokenSymbol,
        amount
      } = await action.swap(content);
      const successMessage = `Swap completed successfully from ${amount} ${inputTokenSymbol} (${inputTokenCA}) to ${outputTokenSymbol} (${outputTokenCA})!
Transaction Hash: ${hash}`;
      elizaLogger2.success(successMessage);
      callback == null ? void 0 : callback({
        text: successMessage,
        content: {
          success: true,
          hash
        }
      });
      return true;
    } catch (error) {
      elizaLogger2.error("Error during token swap:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      callback == null ? void 0 : callback({
        text: `Error during token swap: ${errorMessage}`,
        content: { error: errorMessage }
      });
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Swap 100 USDC for BERA"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "Sure, I'll do swap 100 USDC for BERA now.",
          action: "TOKEN_SWAP"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "Swap completed 100 USDC for BERA successfully! Transaction: ..."
        }
      }
    ]
  ]
};

// src/actions/transferAction.ts
import {
  composeContext as composeContext2,
  ModelClass as ModelClass2,
  elizaLogger as elizaLogger3,
  generateObjectDeprecated as generateObjectDeprecated2
} from "@elizaos/core";
import { isAddress, parseUnits as parseUnits2 } from "viem";
var TransferAction = class {
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  async transfer(params) {
    const { items: tokens } = await this.walletProvider.fetchPortfolio();
    if (!params.inputTokenCA && !params.inputTokenSymbol) {
      throw new Error("Input token not provided");
    }
    if (!isAddress(params.recipient)) {
      throw new Error("Invalid recipient address");
    }
    const filters = tokens.filter((t) => {
      var _a;
      return params.inputTokenCA ? t.address === params.inputTokenCA : t.symbol === ((_a = params.inputTokenSymbol) == null ? void 0 : _a.toUpperCase());
    });
    if (filters.length !== 1) {
      throw new Error(
        "Multiple tokens or no tokens found with the symbol"
      );
    }
    params.inputTokenCA = filters[0].address;
    params.inputTokenSymbol = filters[0].symbol;
    const decimals = filters[0].decimals ?? 18;
    const tokenAmount = parseUnits2(params.amount, decimals);
    elizaLogger3.info("--- Transfer params:", params, tokenAmount);
    let hash;
    if (params.inputTokenCA != NATIVE_ADDRESS) {
      hash = await this.walletProvider.transfer(
        params.inputTokenCA,
        tokenAmount,
        params.recipient
      );
    } else {
      hash = await this.walletProvider.sendTransaction({
        to: params.recipient,
        value: tokenAmount,
        nonce: await this.walletProvider.getNonce()
      });
    }
    return {
      hash,
      ...params
    };
  }
};
var transferAction = {
  name: "TOKEN_TRANSFER",
  description: "Perform transfering tokens on Berachain.",
  similes: [
    "TRANSFER_TOKEN",
    "TOKEN_TRANSFER_ON_BERACHAIN",
    "SEND_TOKENS",
    "SEND_TOKENS_ON_BERACHAIN"
  ],
  validate: async (runtime, _message) => {
    await validateBerachainConfig(runtime);
    return true;
  },
  handler: async (runtime, message, state, _options, callback) => {
    elizaLogger3.log("Starting Berachain TOKEN_TRANSFER handler...");
    const walletProvider = await initWalletProvider(runtime);
    const action = new TransferAction(walletProvider);
    let currentState = state ?? await runtime.composeState(message);
    if (state) {
      currentState = await runtime.updateRecentMessageState(currentState);
    }
    const transferContext = composeContext2({
      state: currentState,
      template: transferTemplate
    });
    const content = await generateObjectDeprecated2({
      runtime,
      context: transferContext,
      modelClass: ModelClass2.SMALL
    });
    elizaLogger3.info("generate transfer content:", content);
    try {
      const { hash, inputTokenCA, inputTokenSymbol, amount, recipient } = await action.transfer(content);
      const successMessage = `Transfer completed successfully ${amount} ${inputTokenSymbol} (${inputTokenCA}) to address ${recipient}!
Transaction Hash: ${hash}`;
      elizaLogger3.success(successMessage);
      callback == null ? void 0 : callback({
        text: successMessage,
        content: {
          success: true,
          hash
        }
      });
      return true;
    } catch (error) {
      elizaLogger3.error("Error during token transfer:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      callback == null ? void 0 : callback({
        text: `Error during token transfer: ${errorMessage}`,
        content: { error: errorMessage }
      });
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Send 1 BERA to 0x708a4472eD832c54a76b30Ae247c33dDa1BF3785"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "Sure, I'll do send 1 BERA to 0x708a4472eD832c54a76b30Ae247c33dDa1BF3785 now.",
          action: "TOKEN_TRANSFER"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "Transfer completed 1 BERA to 0x708a4472eD832c54a76b30Ae247c33dDa1BF3785 successfully! Transaction: ..."
        }
      }
    ]
  ]
};

// src/index.ts
var berachainPlugin = {
  name: "berachain",
  description: "Berachain Plugin for Eliza",
  actions: [swapAction, transferAction],
  providers: [],
  evaluators: []
};
var index_default = berachainPlugin;
export {
  berachainPlugin,
  index_default as default
};
//# sourceMappingURL=index.js.map