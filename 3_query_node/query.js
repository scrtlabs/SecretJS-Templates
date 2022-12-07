const { SecretNetworkClient } = require("secretjs");

require("dotenv").config();

(async () => {
  // Create a readonly connection to Secret Network node
  // Docs: https://github.com/scrtlabs/secret.js#secretnetworkclient
  const secretjs = new SecretNetworkClient({
    url: process.env.SECRET_REST_URL,
  });

  // 1. Query node info
  const nodeInfo = await secretjs.query.tendermint.getNodeInfo({});
  console.log("Node Info:", nodeInfo);

  // 2.1 Get the latest block
  const latestBlock = await secretjs.query.tendermint.getLatestBlock({});
  console.log("Latest Block:", latestBlock);

  // 2.2 Get block by height
  const blockHeight = String(Number(latestBlock.block.header.height) - 10);
  const blockByHeight = await secretjs.query.tendermint.getBlockByHeight({
    height: blockHeight,
  });
  console.log(`Block ${blockHeight}:`, blockByHeight);

  // 3. Query account
  // This will throw if you don't have any SCRT in it
  try {
    const account = await secretjs.query.auth.account({
      address: process.env.ADDRESS,
    });
    console.log("Found Account:", account);
  } catch (error) {
    console.log("Account Not Found:", error.message);
  }
})();
