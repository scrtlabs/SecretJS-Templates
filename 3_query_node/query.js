const {
  CosmWasmClient
} = require("secretjs");

require('dotenv').config();

const main = async () => {
  // Create connection to DataHub Secret Network node
  const client = new CosmWasmClient(process.env.SECRET_REST_URL)

  // 1. Query node info
  const nodeInfo = await client.restClient.nodeInfo();
  console.log('Node Info: ', nodeInfo);

  // 2.1 Query latest blocks
  const blocksLatest = await client.restClient.blocksLatest();
  console.log('Latest block: ', blocksLatest);
  
  // 2.2 Block by number, defaults to latest but lets get by previous block height 
  const blocks = await client.restClient.blocks(blocksLatest.block.header.height - 1);
  console.log('Blocks: ', blocks);

  // 3. Query account
  const account = await client.getAccount(process.env.ADDRESS)
  console.log('Account: ', account);
}

main().then(resp => {
  console.log(resp);
}).catch(err => {
  console.log(err);
})
