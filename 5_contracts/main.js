const { Wallet, SecretNetworkClient } = require("secretjs");

const fs = require("fs");

// Load environment variables
require("dotenv").config();

const main = async () => {
  // Import wallet from mnemonic phrase
  // Use key created in tutorial #2
  const wallet = new Wallet(process.env.MNEMONIC);

  // Create a connection to Secret Network node
  // Pass in a wallet that can sign transactions
  // Docs: https://github.com/scrtlabs/secret.js#secretnetworkclient
  // const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
  const secretjs = await SecretNetworkClient.create({
    grpcWebUrl: process.env.SECRET_GRPC_WEB_URL,
    wallet: wallet,
    walletAddress: wallet.address,
    chainId: process.env.SECRET_CHAIN_ID,
    // encryptionUtils: window.getEnigmaUtils(process.env.CHAIN_ID)
  });
  console.log(`Wallet address=${wallet.address}`);

  // Upload the wasm of a simple contract
  const wasm = fs.readFileSync("5_contracts/contract.wasm");
  console.log("Uploading contract");

  let tx = await secretjs.tx.compute.storeCode(
    {
      sender: wallet.address,
      wasmByteCode: wasm,
      source: "",
      builder: "",
    },
    {
      gasLimit: 1_000_000,
    }
  );

  const codeId = Number(
    tx.arrayLog.find((log) => log.type === "message" && log.key === "code_id")
      .value
  );

  console.log("codeId: ", codeId);

  // contract hash, useful for contract composition
  const contractCodeHash = await secretjs.query.compute.codeHash(codeId);
  console.log(`Contract hash: ${contractCodeHash}`);

  // Create an instance of the Counter contract, providing a starting count
  const initMsg = { count: 101 };
  tx = await secretjs.tx.compute.instantiateContract(
    {
      codeId: codeId,
      sender: wallet.address,
      codeHash: contractCodeHash,
      initMsg: initMsg,
      label: "My Counter" + Math.ceil(Math.random() * 10000),
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

  // Query the current count
  console.log("Querying contract for current count");
  const { count } = await secretjs.query.compute.queryContract({
    contractAddress: contractAddress,
    codeHash: contractCodeHash,
    query: { get_count: {} },
  });

  console.log(`Count=${count}`);

  // Increment the counter
  console.log("Updating count");

  tx = await secretjs.tx.compute.executeContract(
    {
      sender: wallet.address,
      contractAddress: contractAddress,
      codeHash: contractCodeHash, // optional but way faster
      msg: {increment: {}},
      sentFunds: [], // optional
    },
    {
      gasLimit: 100_000,
    }
  );

  // Query again to confirm it worked
  console.log("Querying contract for updated count");
  const newCount = await secretjs.query.compute.queryContract({
    contractAddress: 'secret12k65eh8zvhjcwcnqxjh97pmztu34938602eq87',
    codeHash: 'a4a0c144745e3240bbfcd3f3d0d125a607e265a141ee812f71055054ceb4d8d2',
    query: { get_count: {} },
  });

  console.log(`New Count=${JSON.stringify(newCount)}`);
};

main();
