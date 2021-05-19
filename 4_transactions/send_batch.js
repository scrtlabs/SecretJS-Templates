const {
    BroadcastMode, CosmWasmClient, EnigmaUtils, Secp256k1Pen, pubkeyToAddress, encodeSecp256k1Pubkey, makeSignBytes
} = require("secretjs");

require('dotenv').config();

const sleep = (secs) => new Promise((accept) => setTimeout(accept, secs * 1000));

const main = async () => {
    
    const mnemonic = process.env.MNEMONIC;
    const signingPen = await Secp256k1Pen.fromMnemonic(mnemonic);
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
    const accAddress = pubkeyToAddress(pubkey, 'secret');
    const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
    const client = new CosmWasmClient(
        process.env.SECRET_REST_URL, 
        txEncryptionSeed, 
        BroadcastMode.Async
    );

    const sendMsg = {
        type: "cosmos-sdk/MsgSend",
        value: {
            from_address: accAddress,
            to_address: accAddress,
            amount: [
                {
                    denom: "uscrt",
                    amount: "1000000",
                },
            ],
        },
    };

    const fee = {
        amount: [
            {
                amount: "50000",
                denom: "uscrt",
            },
        ],
        gas: "100000",
    };

    const chainId = await client.getChainId();
    const startHeight = await client.getHeight();
    const { accountNumber, sequence } = await client.getNonce(accAddress);
    let memo;
    const batchSize = 10;
    let i;
    const transactions = []

    for (i = 0; i < batchSize; i++) {
        memo = `Batch tx ${i} of ${batchSize}`

        const signBytes = makeSignBytes([sendMsg], fee, chainId, memo, accountNumber, sequence + i);
        const signature = await signingPen.sign(signBytes);
        const signedTx = {
            msg: [sendMsg],
            fee: fee,
            memo: memo,
            signatures: [signature],
        };
        const { logs, transactionHash } = await client.postTx(signedTx);
        transactions.push(transactionHash);
    }

    // wait for the next block
    while (true) {
        const currentHeight = await client.getHeight()
        if (currentHeight > startHeight) {
            break
        }
        console.log('Waiting for next block');
        await sleep(1)
    }

    // now search all the transactions
    for (i = 0; i < transactions.length; i++) {
        const query = {id: transactions[i]}
        console.log('Searching: ', query);
        const tx = await client.searchTx(query)
        console.log('Transaction: ', tx);
    }
}

main().then(resp => {
    console.log(resp);
}).catch(err => {
    console.log(err);
})
