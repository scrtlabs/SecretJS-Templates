## SecretJS-Templates

Templates for working with SecretJS

### Contents
* Connecting to Secret Network
* Creating account using SecretJS
* Query Secret Network
* Submitting transactions
* Using contracts
* Wallets
* SNIP-20 tokens
* Consume Websocket contract events

## 1. Installation

To install all required packages run:

```bash
npm install
```

## 2. Setup
Make sure to copy .env.example file to .env file and update its contents.

.env.example is mainnet config, 
to test locally copy .env.local.example, and for testnet copy .env.testnet.example

## 3. Running tutorials

* `npm run 1` - Connecting to node tutorial 
* `npm run 2` - Creating account tutorial 
* `npm run 3` - Query node tutorial 
* `npm run 4` - Transfer tokens - simple
* `npm run 4:advanced` - Transfer tokens - advanced
* `npm run 4:batch` - Send multiple txs the same block
* `npm run 4:batch_same_tx` - Send multiple messages in the same transaction
* `npm run 5` - Create, deploy and use a Secret Contract
* `cd 6_wallets/keplr && npm i && npm run dev` - Keplr wallet
* `npm run 7` - SNIP-20 token.  Creating and using fungible tokens
* `cd 8_websocket && npm i && npm run dev` - Consume Websocket contract events