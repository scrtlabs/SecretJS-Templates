## SecretJS-Templates

Templates for working with secret.js.

For secret.js docs go to https://github.com/scrtlabs/secret.js

### Contents

- Connecting to Secret Network
- Creating account using SecretJS
- Query Secret Network
- Submitting transactions
- Using contracts
- Wallets
- SNIP-20 tokens
- Consume Websocket contract events

## 1. Installation

To install all required packages run:

```bash
npm install
```

## 2. Setup

Make sure to copy `.env.testnet.example` file to `.env` file and update its contents. To test locally copy `.env.local.example` into `.env`.

## 3. Running tutorials

- `npm run 1` - Connecting to node tutorial
- `npm run 2` - Creating account tutorial
- `npm run 3` - Query node tutorial
- `npm run 4` - Transfer tokens - simple
- `npm run 4:batch` - Send multiple txs in the same block
- `npm run 4:batch_same_tx` - Send multiple messages in the same transaction
- `npm run 5` - Create, deploy and use a Secret Contract
- `npm run 5:multi` - Create, deploy and use a Secret Contract with multiple messages in the same transaction
- `cd 6_wallets/keplr && npm i && npm run dev` - Keplr wallet
- `npm run 7` - SNIP-20 token. Creating and using fungible tokens
- `cd 8_websocket && npm i && npm run dev` - Consume Websocket contract 
events
- `npm run 9` - SNIP-24 token. Creating and using fungible tokens with query permits instead of viewing keys
