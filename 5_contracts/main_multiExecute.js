const {
  EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey
} = require("secretjs");

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
  const wasm = fs.readFileSync("5_contracts/contract.wasm");
  console.log('Uploading contract')
  const uploadReceipt = await client.upload(wasm, {});

  // Get the code ID from the receipt
  const codeId = uploadReceipt.codeId;
  console.log('codeId: ', codeId);

  // contract hash, useful for contract composition
  const contractCodeHash = await client.restClient.getCodeHashByCodeId(codeId);
  console.log(`Contract hash: ${contractCodeHash}`);

  // Create an instance of the Counter contract, providing a starting count
  const initMsg = {"count": 101}
  const contract = await client.instantiate(codeId, initMsg, "My Counter" + Math.ceil(Math.random()*10000));
  console.log('contract: ', contract);
  
  const contractAddress = contract.contractAddress;

  // Query the current count
  console.log('Querying contract for current count');
  let response = await client.queryContractSmart(contractAddress, { "get_count": {}});

  console.log(`Count=${response.count}`)

  // Increment the counter with a multimessage
  const handleMsg = { increment: {} };

  // Send the same handleMsg to increment multiple times
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
      {
        contractAddress,
        handleMsg
      },
    ]
  );
  console.log('response: ', response);

  // Query again to confirm it worked, and incremented the counter thrice
  console.log('Querying contract for updated count');
  response = await client.queryContractSmart(contractAddress, { "get_count": {}})

  console.log(`New Count=${response.count}`);
};

main();
