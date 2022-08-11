### Interacting with contracts

The example contract here is already compiled as `contract.wasm`, [learn how to roll your own here](https://docs.scrt.network/secret-network-documentation/development/intro-to-secret-contracts)

- `main.js` uploads `contract.wasm`, instantiates the contract, then executes to update the state, ie increment the counter, and finally queries the contract state.

- `main_broadcast.js` does all the same things, the variation demonstrates how to conveniently execute multiple messages in the same transaction.

    To execute a single message, we do this in the first example;

    ```js
    await secretjs.tx.compute.executeContract({
        sender: wallet.address,
        contractAddress: contractAddress,
        codeHash: contractCodeHash,
        msg: {increment: {}},
        },
        {
        gasLimit: 100_000,
        }
    );
    ```

    But suppose we wanted to send tokens to multiple recipients, or execute multiple contracts, or in our simple counter's case, increment the counter multiple times. 
    Then we can use `broadcast` with multiple messages;

    ```js
    // init the message/s
    const incrMessage = new MsgExecuteContract({
        sender: wallet.address,
        contractAddress: contractAddress,
        codeHash: contractCodeHash,
        msg: {increment: {}}
    });

    // multiple requests to increment
    tx = await secretjs.tx.broadcast([incrMessage, incrMessage], {
        gasLimit: 200_000,
    });
    ```

    That just sent the same handleMsg to the same contract twice.
    
    Here's a more realistic example that converts SCRT to sSCRT, and sends sSCRT to 2 different accounts;
    ```js

    const convertScrtMessage = new MsgExecuteContract({
        sender: bob,
        contractAddress: SSCRT_SNIP20_ADDRESS,
        codeHash: contractCodeHash,
        msg: { deposit: {} },
        sentFunds: [[{ amount: String(1_000_000), denom: "uscrt" }]
    });

    const sendToAlice = new MsgSend({
        fromAddress: bob,
        toAddress: ALICE_WALLET_ADDRESS,
        amount: [{ denom: "uscrt", amount: String(600_000) }],
    });

    const sendToEve = new MsgSend({
        fromAddress: bob,
        toAddress: EVE_WALLET_ADDRESS,
        amount: [{ denom: "uscrt", amount: String(400_000) }],
    });

    const sim = await secretjs.tx.simulate([convertScrtMessage, sendToAlice, sendToEve]);
    const tx = await secretjs.tx.broadcast([convertScrtMessage, sendToAlice, sendToEve], {
        // Adjust gasLimit up by 10% to account for gas estimation error
        gasLimit: Math.ceil(sim.gasInfo.gasUsed * 1.1),
    });
    ```

    You can find more examples of broadcasting complex transactions on [Secret.JS](https://github.com/scrtlabs/secret.js#secretjstxbroadcast)