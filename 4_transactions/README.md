### Sending transactions

- transfer.js 
This is most convenient, thanks to SigningCosmWasmClient's sendTokens method

- send.js 
Send tokens using CosmWasmClient to post a StdTx, more flexible for when you need fine grained control over the transaction.

- send_batch.js
Variation of `send.js` to dispatch multiple txs asynchronously, by querying the account's sequence upfront, and incrementing that for every new transaction.

- send_batch_same_tx.js
Variation of `send_batch.js`, sending multiple messages in the same transaction.
