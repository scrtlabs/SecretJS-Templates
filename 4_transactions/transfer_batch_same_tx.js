const { SecretNetworkClient, Wallet, MsgSend } = require("secretjs");

require("dotenv").config();

const main = async () => {
  // Import wallet from mnemonic phrase
  const wallet = new Wallet(process.env.MNEMONIC);

  // Create a connection to Secret Network node
  // Pass in a wallet that can sign transactions
  // Docs: https://github.com/scrtlabs/secret.js#secretnetworkclient
  const secretjs = new SecretNetworkClient({
    url: process.env.SECRET_REST_URL,
    wallet: wallet,
    walletAddress: wallet.address,
    chainId: process.env.SECRET_CHAIN_ID,
  });

  const tx = await secretjs.tx.broadcast(
    [
      new MsgSend({
        amount: [{ amount: "1", denom: "uscrt" }],
        from_address: wallet.address,
        to_address: wallet.address, // Set recipient to sender for testing
      }),
      new MsgSend({
        amount: [{ amount: "1", denom: "uscrt" }],
        from_address: wallet.address,
        to_address: wallet.address, // Set recipient to sender for testing
      }),
      new MsgSend({
        amount: [{ amount: "1", denom: "uscrt" }],
        from_address: wallet.address,
        to_address: wallet.address, // Set recipient to sender for testing
      }),
    ],
    {
      gasLimit: 40_000,
      gasPriceInFeeDenom: 0.25,
      memo: "multi send tokens example",
    }
  );

  console.log("Transaction 1:", tx);

  // The point of this exercise is to use secretjs.tx.broadcast() to send multiple
  // messages in the same tx, however for this scenario (sending tokens multiple times)
  // you can do this:
  const tx2 = await secretjs.tx.bank.multiSend(
    {
      inputs: [
        {
          address: wallet.address,
          coins: [{ denom: "uscrt", amount: "3" }],
        },
      ],
      outputs: [
        {
          address: wallet.address, // Set recipient to sender for testing
          coins: [{ denom: "uscrt", amount: "1" }],
        },
        {
          address: wallet.address, // Set recipient to sender for testing
          coins: [{ denom: "uscrt", amount: "1" }],
        },
        {
          address: wallet.address, // Set recipient to sender for testing
          coins: [{ denom: "uscrt", amount: "1" }],
        },
      ],
    },
    {
      gasLimit: 20_000,
      gasPriceInFeeDenom: 0.25,
      memo: "multi send tokens example",
    }
  );

  console.log("Transaction 2:", tx2);
};

main()
  .then((resp) => {
    console.log(resp);
  })
  .catch((err) => {
    console.log(err);
  });
