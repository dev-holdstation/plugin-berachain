export const swapTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

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
