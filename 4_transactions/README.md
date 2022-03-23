### Sending transactions

- transfer.js
  This uses the convenience method SigningCosmWasmClient.sendTokens

- transfer_batch.js
  Variation of `transfer.js` to dispatch multiple txs asynchronously, by querying the account's sequence upfront, and incrementing that for every new transaction.

- send_batch_same_tx.js
  Variation of `send_batch.js`, sending multiple messages in the same transaction.
