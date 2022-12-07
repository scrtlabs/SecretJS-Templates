const { SecretNetworkClient, Wallet } = require("secretjs");

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

  const account = await secretjs.query.auth.account({
    address: wallet.address,
  });

  const txHashes = [];
  for (let i = 0; i < 10; i++) {
    const tx = await secretjs.tx.bank.send(
      {
        amount: [{ amount: "1", denom: "uscrt" }],
        from_address: wallet.address,
        to_address: wallet.address, // Set recipient to sender for testing
      },
      {
        gasLimit: 20_000,
        gasPriceInFeeDenom: 0.25,
        memo: `send batch tokens example #${i + 1}`,
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
};

main()
  .then((resp) => {
    console.log(resp);
  })
  .catch((err) => {
    console.log(err);
  });

function sleep(ms) {
  return new Promise((accept) => setTimeout(accept, ms));
}
