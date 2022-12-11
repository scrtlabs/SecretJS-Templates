const { SecretNetworkClient } = require("secretjs");

require("dotenv").config();

(async () => {
  // Create a readonly connection to Secret Network node
  // Docs: https://github.com/scrtlabs/secret.js#secretnetworkclient
  const secretjs = new SecretNetworkClient({
    url: process.env.SECRET_LCD_URL,
  });

  // Query chain id & height
  const latestBlock = await secretjs.query.tendermint.getLatestBlock({});
  console.log("ChainId:", latestBlock.block.header.chain_id);
  console.log("Block height:", latestBlock.block.header.height);

  console.log("Successfully connected to Secret Network");
})();
