### Interacting with contracts

The example contract here is already compiled as `contract.wasm`, [learn how to roll your own here](https://build.scrt.network/dev/quickstart.html#create-initial-smart-contract)

- `main.js` uploads `contract.wasm`, instantiates the contract, then executes to update the state, ie increment the counter, and finally queries the contract state.

- `main_multiExecute.js` does all the same things, the variation demonstrates how to conveniently execute multiple messages in the same transaction.

    To execute a single message, we do this in the first example;

    ```js
    const handleMsg = { increment: {} };
    response = await client.execute(contractAddress, handleMsg);
    ```

    But suppose we wanted to send tokens to multiple recipients, or execute multiple contracts, or in our simple counter's case, increment the counter multiple times. 
    Then we can use `multiExecute`;

    ```js
    const handleMsg = { increment: {} };
    response = await client.multiExecute(
        [
        {
            contractAddress,
            handleMsg
        },
        {
            contractAddress,
            handleMsg
        },
        ]
    );
    ```

    That just sent the same handleMsg to the same contract twice.
    
    Here's a more realistic example that converts SCRT to sSCRT, and sends sSCRT to 2 different accounts;
    ```js
    client.multiExecute(
    [
        // Convert 1 SCRT to 1 sSCRT
        {
        contractAddress: SSCRT_SNIP20_ADDRESS,
        handleMsg: { deposit: {} },
        transferAmount: [{ amount: String(1_000_000), denom: "uscrt" }],
        },
        // Then send 0.6 sSCRT to Alice
        {
        contractAddress: SSCRT_SNIP20_ADDRESS,
        handleMsg: {
            transfer: {
            recipient: ALICE_WALLET_ADDRESS,
            amount: String(600_000),
            },
        },
        },
        // Then send 0.4 sSCRT to Bob
        {
        contractAddress: SSCRT_SNIP20_ADDRESS,
        handleMsg: {
            transfer: {
            recipient: BOB_WALLET_ADDRESS,
            amount: String(400_000),
            },
        },
        },
    ],
    ```