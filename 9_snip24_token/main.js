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
  const wasm = fs.readFileSync("9_snip24_token/contract/contract.wasm");
  console.log("Uploading contract");

  let tx = await secretjs.tx.compute.storeCode(
    {
      sender: wallet.address,
      wasm_byte_code: wasm,
      source: "",
      builder: "",
    },
    {
      gasLimit: 3_200_000,
    }
  );
  console.log('Upload tx hash', tx.transactionHash)

  const codeId = Number(
    tx.arrayLog.find((log) => log.type === "message" && log.key === "code_id")
      .value
  );
  // const codeId = 650

  console.log("codeId: ", codeId);
  // contract hash, useful for contract composition
  const contractCodeHash = (await secretjs.query.compute.codeHashByCodeId({code_id: codeId})).code_hash;
  console.log(`Contract hash: ${contractCodeHash}`);
  
  const initMsg = {
    name: "test",
    symbol: "STOKE",
    decimals: 6,
    prng_seed: Buffer.from("Something else really random").toString("base64"),
    admin: accAddress,
    config: {
      public_total_supply: true,
      enable_deposit: true,
      enable_redeem: true,
      enable_mint: true,
      enable_burn:true
    },
    supported_denoms:["uscrt"],
    initial_balances: [
      {
        address: accAddress,
        amount: "100000000", //Mint 100 tokens
      },
    ],
  };

  tx = await secretjs.tx.compute.instantiateContract(
    {
      code_id: codeId,
      sender: wallet.address,
      code_hash: contractCodeHash,
      init_msg: initMsg,
      label: "STOKE" + Math.ceil(Math.random() * 10000),
    },
    {
      gasLimit: 100_000,
    }
  );
  console.log('Instantiate tx hash', tx.transactionHash)

  //Find the contract_address in the logs
  const contractAddress = tx.arrayLog.find(
    (log) => log.type === "message" && log.key === "contract_address"
  ).value;
  console.log(`contractAddress=${contractAddress}`);

  // Query permit to view balance
  const permit = await secretjs.utils.accessControl.permit.sign(
      wallet.address,
      "pulsar-3",
      "test",
      [contractAddress],
      ["owner", "balance"],
      false,
    );

  let query = await secretjs.query.snip20.getBalance({
    contract: { address: contractAddress, code_hash: contractCodeHash },
    address: wallet.address,
    auth: { permit },
  });

  let balance = query.balance;

  console.log("My token balance: ", balance);

  //Deposit SCRT in exchange for STOKE
  console.log("Depositing tokens");

  handleMsg = {
    deposit: {}
  };

  tx = await secretjs.tx.compute.executeContract(
    {
      sender: wallet.address,
      contract_address: contractAddress,
      code_hash: contractCodeHash,
      msg: handleMsg,
      sent_funds: [
        {
          denom: 'uscrt',
          amount: '2000000' // 2 SCRT
        }
      ],
    },
    {
      gasLimit: 100_000,
    }
  );
  console.log('deposit tx hash', tx.transactionHash);

  query = await secretjs.query.snip20.getBalance({
    contract: { address: contractAddress, code_hash: contractCodeHash },
    address: wallet.address,
    auth: { permit },
  });

  balance = query.balance;

  console.log("Token balance after depositing SCRT for STOKE", balance);

  console.log("Transferring tokens");

  // Transfer some tokens to a new wallet
  const anotherWallet = new Wallet();

  handleMsg = {
    transfer: {
      owner: accAddress,
      amount: "3000000", //send 3 tokens
      recipient: anotherWallet.address,
    },
  };

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
  console.log('transfer tx hash', tx.transactionHash);

  query = await secretjs.query.snip20.getBalance({
    contract: { address: contractAddress, code_hash: contractCodeHash },
    address: wallet.address,
    auth: { permit },
  });

  balance = query.balance;
  console.log("Token balance after transfer", balance);
};

main();
