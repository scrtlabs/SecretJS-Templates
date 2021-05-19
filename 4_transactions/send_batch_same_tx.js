const {
    CosmWasmClient, EnigmaUtils, Secp256k1Pen, pubkeyToAddress, encodeSecp256k1Pubkey, makeSignBytes
} = require("secretjs");

require('dotenv').config();

const main = async () => {
    
    const mnemonic = process.env.MNEMONIC;
    const signingPen = await Secp256k1Pen.fromMnemonic(mnemonic);
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
    const accAddress = pubkeyToAddress(pubkey, 'secret');
    const client = new CosmWasmClient(
        process.env.SECRET_REST_URL
    );

    const fee = {
        amount: [
            {
                amount: "50000",
                denom: "uscrt",
            },
        ],
        gas: "200000",
    };

    const chainId = await client.getChainId();
    const { accountNumber, sequence } = await client.getNonce(accAddress);
    const batchSize = 3;
    const messages = [];
    let i;

    // List of msgs sending one SCRT
    for (i = 0; i < batchSize; i++) {
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
        messages.push(sendMsg)
    }

    const memo = "Multi message";
    const signBytes = makeSignBytes(messages, fee, chainId, memo, accountNumber, sequence);
    const signature = await signingPen.sign(signBytes);
    const signedTx = {
        msg: messages,
        fee: fee,
        memo: memo,
        signatures: [signature],
    };
    const { logs, transactionHash } = await client.postTx(signedTx);
    
    const query = {id: transactionHash}
    const tx = await client.searchTx(query)
    console.log('Transaction: ', tx);
}

main().then(resp => {
    console.log(resp);
}).catch(err => {
    console.log(err);
})
