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
  const secretjs = await SecretNetworkClient.create({
    grpcWebUrl: process.env.SECRET_GRPC_WEB_URL,
    wallet: wallet,
    walletAddress: wallet.address,
    chainId: process.env.SECRET_CHAIN_ID,
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
  const initMsg = { count: 0 };
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


  // query the account so we have the account number and sequence
  const account = await secretjs.query.auth.account({
    address: wallet.address,
  });

  const txHashes = [];
  for (let i = 0; i < 10; i++) {
    const tx = await secretjs.tx.compute.executeContract(
      {
        sender: wallet.address,
        contractAddress: contractAddress,
        codeHash: contractCodeHash, // optional but way faster
        msg: {increment: {}},
        sentFunds: [], // optional
      },
      {
        gasLimit: 25_000,
        gasPriceInFeeDenom: 0.25,
        memo: `send batch increment counter example #${i + 1}`,
        waitForCommit: false,
        explicitSignerData: {
          accountNumber: Number(account.account.accountNumber),
          sequence: Number(account.account.sequence) + i,
          chainId: process.env.SECRET_CHAIN_ID,
        },
      }
    );

    
    txHashes.push(tx.transactionHash);
  }

  let i = 1;
  for (const txhash of txHashes) {
    console.log(`Waiting for tx ${i} (txhash ${txhash})`);
    let tx;
    while (true) {
      tx = await secretjs.query.getTx(txhash);
      if (tx) {
        break;
      }
      await sleep(100);
    }

    if (tx.code === 0) {
      console.log(
        `tx ${i} (txhash ${txhash}) was successful in block ${tx.height}`
      );
    } else {
      console.log(
        `tx ${i} (txhash ${txhash}) was unsuccessful in block ${tx.height}, error log: ${tx.rawLog}`
      );
    }

    i++;
  }

  // Query again to confirm it worked
  console.log("Querying contract for updated count");
  const newCount = await secretjs.query.compute.queryContract({
    contractAddress: contractAddress,
    codeHash: contractCodeHash,
    query: { get_count: {} },
  });

  console.log(`New Count=${newCount.count}`);
};

main();


function sleep(ms) {
  return new Promise((accept) => setTimeout(accept, ms));
}
