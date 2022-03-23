const { SecretNetworkClient, Wallet } = require("secretjs");

require("dotenv").config();

const main = async () => {
  // Import wallet from mnemonic phrase
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

  const tx = await secretjs.tx.bank.send(
    {
      amount: [{ amount: "1", denom: "uscrt" }],
      fromAddress: wallet.address,
      toAddress: wallet.address, // Set recipient to sender for testing
    },
    {
      gasLimit: 20_000,
      gasPriceInFeeDenom: 0.25,
      memo: "send tokens example",
    }
  );

  console.log("Transaction: ", tx);
};

main()
  .then((resp) => {
    console.log(resp);
  })
  .catch((err) => {
    console.log(err);
  });
