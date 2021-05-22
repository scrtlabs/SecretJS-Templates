### Sending transactions

- transfer.js 
This uses the convenience method SigningCosmWasmClient.sendTokens

- send.js 
Sends tokens using CosmWasmClient to post a StdTx, more flexible for when you need fine grained control over the transaction. Here we also send a `cosmos-sdk/MsgSend`, you can craft any other types.

- send_batch.js
Variation of `send.js` to dispatch multiple txs asynchronously, by querying the account's sequence upfront, and incrementing that for every new transaction.

- send_batch_same_tx.js
Variation of `send_batch.js`, sending multiple messages in the same transaction.
