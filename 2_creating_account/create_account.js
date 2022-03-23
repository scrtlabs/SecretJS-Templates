const { SecretNetworkClient, Wallet } = require("secretjs");

require("dotenv").config();

(async () => {
  // Create a new account
  // Docs: https://github.com/scrtlabs/secret.js#wallet
  const wallet = new Wallet();

  // Create a readonly connection to Secret Network node
  // Docs: https://github.com/scrtlabs/secret.js#secretnetworkclient
  const secretjs = await SecretNetworkClient.create({
    grpcWebUrl: process.env.SECRET_GRPC_WEB_URL,
  });

  const accountBalance = await secretjs.query.bank.balance({
    address: wallet.address,
    denom: "uscrt",
  });

  console.log("mnemonic:", wallet.mnemonic);
  console.log("address:", wallet.address);
  console.log("balance:", `${accountBalance.balance.amount / 10e6} SCRT`); // 1,000,00 uscrt = 1 SCRT
})();
