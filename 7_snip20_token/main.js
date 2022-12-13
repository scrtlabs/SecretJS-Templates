const { Wallet, SecretNetworkClient, EncryptionUtilsImpl, fromUtf8, MsgExecuteContractResponse } = require("secretjs");

const fs = require("fs");

// Load environment variables
require("dotenv").config();

const main = async () => {
  const wallet = new Wallet(process.env.MNEMONIC);

  // Create a connection to Secret Network node
  // Pass in a wallet that can sign transactions
  // Docs: https://github.com/scrtlabs/secret.js#secretnetworkclient
  const txEncryptionSeed = EncryptionUtilsImpl.GenerateNewSeed();
  const secretjs = new SecretNetworkClient({
    url: process.env.SECRET_LCD_URL,
    wallet: wallet,
    walletAddress: wallet.address,
    chainId: process.env.SECRET_CHAIN_ID,
    txEncryptionSeed: txEncryptionSeed
  });
  console.log(`Wallet address=${wallet.address}`);
  const accAddress = wallet.address;

  // Upload the wasm of a simple contract
  const wasm = fs.readFileSync("7_snip20_token/contract/contract.wasm");
  console.log("Uploading contract");

  let tx = await secretjs.tx.compute.storeCode(
    {
      sender: wallet.address,
      wasm_byte_code: wasm,
      source: "",
      builder: "",
    },
    {
      gasLimit: 2_000_000,
    }
  );

  const codeId = Number(
    tx.arrayLog.find((log) => log.type === "message" && log.key === "code_id")
      .value
  );

  console.log("codeId: ", codeId);
  // contract hash, useful for contract composition
  const contractCodeHash = (await secretjs.query.compute.codeHashByCodeId({code_id: codeId})).code_hash;
  console.log(`Contract hash: ${contractCodeHash}`);

  // Create an instance of the token contract, minting some tokens to our wallet
  const initMsg = {
    name: "test",
    symbol: "TST",
    decimals: 6,
    prng_seed: Buffer.from("Something really random").toString("base64"),
    admin: accAddress,
    initial_balances: [
      {
        address: accAddress,
        amount: "1000000000",
      },
    ],
  };

  tx = await secretjs.tx.compute.instantiateContract(
    {
      code_id: codeId,
      sender: wallet.address,
      code_hash: contractCodeHash,
      init_msg: initMsg,
      label: "My Token" + Math.ceil(Math.random() * 10000),
    },
    {
      gasLimit: 100_000,
    }
  );

  //Find the contract_address in the logs
  const contractAddress = tx.arrayLog.find(
    (log) => log.type === "message" && log.key === "contract_address"
  ).value;
  console.log(`contractAddress=${contractAddress}`);

  // Entropy: Secure implementation is left to the client, but it is recommended to use base-64 encoded random bytes and not predictable inputs.
  const entropy = "Another really random thing";

  let handleMsg = { create_viewing_key: { entropy: entropy } };
  console.log("Creating viewing key");
  tx = await secretjs.tx.compute.executeContract(
    {
      sender: wallet.address,
      contract_address: contractAddress,
      code_hash: contractCodeHash, // optional but way faster
      msg: handleMsg,
      sent_funds: [], // optional
    },
    {
      gasLimit: 100_000,
    }
  );

  // Convert the UTF8 bytes to String, before parsing the JSON for the api key.
  const apiKey = JSON.parse(fromUtf8(MsgExecuteContractResponse.decode(tx.data[0]).data)).create_viewing_key.key;

  // Query balance with the api key
  const balanceQuery = {
    balance: {
      key: apiKey,
      address: accAddress,
    },
  };

  let balance = await secretjs.query.compute.queryContract({
    contract_address: contractAddress,
    code_hash: contractCodeHash,
    query: balanceQuery,
  });

  console.log("My token balance: ", balance);

  // Transfer some tokens to a new wallet
  const anotherWallet = new Wallet();

  handleMsg = {
    transfer: {
      owner: accAddress,
      amount: "10000000",
      recipient: anotherWallet.address,
    },
  };
  console.log("Transferring tokens");

  tx = await secretjs.tx.compute.executeContract(
    {
      sender: wallet.address,
      contract_address: contractAddress,
      code_hash: contractCodeHash,
      msg: handleMsg
    },
    {
      gasLimit: 100_000,
    }
  );

  balance = await secretjs.query.compute.queryContract({
    contract_address: contractAddress,
    code_hash: contractCodeHash,
    query: balanceQuery,
  });
  console.log("New token balance", balance);
};

main();
