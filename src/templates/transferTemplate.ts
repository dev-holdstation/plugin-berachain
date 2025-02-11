export const transferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

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
