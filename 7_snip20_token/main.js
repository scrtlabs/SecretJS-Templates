const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey, unmarshalTx
  } = require("secretjs");
const { Slip10RawIndex } = require("@iov/crypto");
const { fromUtf8 } = require("@iov/encoding");
  
  const fs = require("fs");
  
  // Load environment variables
  require('dotenv').config();
  
  const customFees = {
    upload: {
        amount: [{ amount: "2000000", denom: "uscrt" }],
        gas: "2000000",
    },
    init: {
        amount: [{ amount: "500000", denom: "uscrt" }],
        gas: "500000",
    },
    exec: {
        amount: [{ amount: "500000", denom: "uscrt" }],
        gas: "500000",
    },
    send: {
        amount: [{ amount: "80000", denom: "uscrt" }],
        gas: "80000",
    },
  }
  
  const main = async () => {
    const httpUrl = process.env.SECRET_REST_URL;
  
    // Use key created in tutorial #2
    const mnemonic = process.env.MNEMONIC;
  
    // A pen is the most basic tool you can think of for signing.
    // This wraps a single keypair and allows for signing.
    const signingPen = await Secp256k1Pen.fromMnemonic(mnemonic);
  
    // Get the public key
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
  
    // get the wallet address
    const accAddress = pubkeyToAddress(pubkey, 'secret');
  
    const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
    
    const client = new SigningCosmWasmClient(
        httpUrl,
        accAddress,
        (signBytes) => signingPen.sign(signBytes),
        txEncryptionSeed, customFees
    );
    console.log(`Wallet address=${accAddress}`)
    
    // Upload the wasm of a simple contract
    const wasm = fs.readFileSync("7_snip20_token/contract/contract.wasm");
    console.log('Uploading contract')
    const uploadReceipt = await client.upload(wasm, {});
  
    // Get the code ID from the receipt
    const codeId = uploadReceipt.codeId;
  
    // Create an instance of the token contract, minting some tokens to our wallet
    const initMsg = {
        "name":"test",
        "symbol":"TST",
        "decimals":6,
        "prng_seed": Buffer.from("Something really random").toString('base64'),
        "admin": accAddress,
        "initial_balances": [{
                "address": accAddress,
                "amount": "1000000000"
            }
        ]
    }
    const contract = await client.instantiate(codeId, initMsg, "My Token" + Math.ceil(Math.random()*10000));
    console.log('contract: ', contract);
    
    const contractAddress = contract.contractAddress;
  
    // Entropy: Secure implementation is left to the client, but it is recommended to use base-64 encoded random bytes and not predictable inputs.
    const entropy = "Another really random thing";


    let handleMsg = { create_viewing_key: {entropy: entropy} };
    console.log('Creating viewing key');
    response = await client.execute(contractAddress, handleMsg);
    console.log('response: ', response);

    // Convert the UTF8 bytes to String, before parsing the JSON for the api key.
    const apiKey = JSON.parse(fromUtf8(response.data)).create_viewing_key.key;

    // Query balance with the api key
    const balanceQuery = { 
        balance: {
            key: apiKey, 
            address: accAddress
        }
    };
    let balance = await client.queryContractSmart(contractAddress, balanceQuery);

    console.log('My token balance: ', balance);

    // Transfer some tokens
    handleMsg = {
        transfer: 
        {
            owner: accAddress, amount: "1000", recipient: await getAddress(mnemonic, 1)
        }
    };
    console.log('Transferring tokens');
    response = await client.execute(contractAddress, handleMsg);
    console.log('Transfer response: ', response)

    balance = await client.queryContractSmart(contractAddress, balanceQuery);
    console.log('New token balance', balance)
  };

  // Util to generate another address to send to
  async function getAddress(mnemonic, index) {
    const signingPen = await Secp256k1Pen.fromMnemonic(mnemonic, [Slip10RawIndex.normal(index)]);
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
    return pubkeyToAddress(pubkey, 'secret');
  }
  
  main();
  