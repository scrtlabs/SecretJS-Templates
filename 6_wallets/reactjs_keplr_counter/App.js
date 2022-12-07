// Run:
// `npx create-react-app secret-dapp`
// `cd secret-dapp`
// `yarn add secretjs` (or `npm i secretjs`)
// Then copy the content of this file into `src/App.js`



import React, { useState, useEffect } from "react";
const { SecretNetworkClient } = require("secretjs");

const DENOM = 'SCRT';
const MINIMAL_DENOM = 'uscrt';

// Testnet, using a known contract
const LCD_URL = 'https://api.pulsar.scrttestnet.com';
const RPC_URL = 'https://rpc.pulsar.scrttestnet.com';
const CHAIN_ID = 'pulsar-2';
const CHAIN_NAME = 'Secret Testnet'; 
const contractAddress = "secret1vuph04rrzxs0admn5w030ek3hrtacttwcdwtvj";

// secretdev / local secret, be sure to set the contract address to the one you deployed
// const CHAIN_NAME = 'Local Testnet';  //Anything you want
// const GRPCWEB_URL = 'http://localhost:9091';
// const LCD_URL = 'http://localhost:1317';
// const RPC_URL = 'http://localhost:26657';
// const CHAIN_ID = "secretdev-1";
// const contractAddress = 'secret1jxv9as6rrv6xztd0thas4q83gsy42p5kvwe6m4';

export default function App() {
  const [myAddress, setMyAddress] = useState("");
  const [count, setCount] = useState(0);
  const [secretjs, setSecretjs] = useState();
  const [keplrReady, setKeplrReady] = useState(false);

   const increment = async () => {
    console.log("incrementing");

    try {
      const tx = await secretjs.tx.compute.executeContract(
        {
          sender: myAddress,
          contract_address: contractAddress,
          msg: { increment: {} }
        },
        {
          gasLimit: 100_000
        }
      );
      console.log(`broadcasted tx=${JSON.stringify(tx)}`);

      const { count } = await secretjs.query.compute.queryContract({
        contract_address: contractAddress,
        query: { get_count: {} }
      });
      console.log(`counter=${count}`);

      setCount(count);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const getKeplr = async () => {

      // Wait for Keplr to be injected to the page
      while (
        !window.keplr &&
        !window.getOfflineSigner &&
        !window.getEnigmaUtils
      ) {
        await sleep(10);
      }

      // Use a custom chain with Keplr.
      // On mainnet we don't need this (`experimentalSuggestChain`).
      // This works well with `Local Secret`:
      //     - https://docs.scrt.network/secret-network-documentation/development/local-secret
      //     - Run a local chain: `docker run -it --rm -p 9091:9091 -p 26657:26657 -p 26656:26656 -p 1317:1317 -p 5000:5000 -v $(shell pwd):/root/code --name secretdev ghcr.io/scrtlabs/localsecret:v1.3.1`
      //     - `alias secretcli='docker exec -it secretdev secretcli'`
      //     - Store a contract: `docker exec -it secretdev secretcli tx compute store /root/code/contract.wasm.gz --from a --gas 10000000 -b block -y`
      // On pulsar-2, set:
      //     1. CHAIN_ID = "pulsar-2"
      //     2. rpc = "https://rpc.pulsar.scrttestnet.com"
      //     3. rest = "https://api.pulsar.scrttestnet.com"
      //     4. chainName = Whatever you like
      // For more examples, go to: https://github.com/chainapsis/keplr-example/blob/master/src/main.js
      await window.keplr.experimentalSuggestChain({
        chainId: CHAIN_ID,
        chainName: CHAIN_NAME,
        rpc: RPC_URL,
        rest: LCD_URL,
        bip44: {
          coinType: 529,
        },
        coinType: 529,
        stakeCurrency: {
          coinDenom: DENOM,
          coinMinimalDenom: MINIMAL_DENOM,
          coinDecimals: 6,
        },
        bech32Config: {
          bech32PrefixAccAddr: "secret",
          bech32PrefixAccPub: "secretpub",
          bech32PrefixValAddr: "secretvaloper",
          bech32PrefixValPub: "secretvaloperpub",
          bech32PrefixConsAddr: "secretvalcons",
          bech32PrefixConsPub: "secretvalconspub",
        },
        currencies: [
          {
            coinDenom: DENOM,
            coinMinimalDenom: MINIMAL_DENOM,
            coinDecimals: 6,
          },
        ],
        feeCurrencies: [
          {
            coinDenom: DENOM,
            coinMinimalDenom: MINIMAL_DENOM,
            coinDecimals: 6,
          },
        ],
        gasPriceStep: {
          low: 0.1,
          average: 0.25,
          high: 0.4,
        },
        features: ["secretwasm"],
      });

      // Enable Keplr.
      // This pops-up a window for the user to allow keplr access to the webpage.
      await window.keplr.enable(CHAIN_ID);

      // Setup SecrtJS with Keplr's OfflineSigner
      // This pops-up a window for the user to sign on each tx we sent

      const keplrOfflineSigner = window.getOfflineSignerOnlyAmino(CHAIN_ID);

      const [{ address: myAddress }] = await keplrOfflineSigner.getAccounts();
      
      const secretjs = new SecretNetworkClient({
        url: LCD_URL,
        chainId: CHAIN_ID,
        wallet: keplrOfflineSigner,
        walletAddress: myAddress,
        encryptionUtils: window.getEnigmaUtils(CHAIN_ID),
      });

      // test contract query
      const { count } = await secretjs.query.compute.queryContract({
        contract_address: contractAddress,
        query: { get_count: {} }
      });

      setCount(count);

      setKeplrReady(true);
      setMyAddress(myAddress);
      setSecretjs(secretjs);
      
    }
      getKeplr();
      
    return () => {};
  }, []);

  return (
    <div className="App">
      <h1>Secret Counter</h1>

      {!keplrReady ? 
          <h1>Waiting for Keplr wallet integration...</h1>
      : 
        <div>
          <p>
            <strong>My Address:</strong> {myAddress}
          </p>
          <p>
            <strong>Counter:</strong> {count}
          </p>
          <p>
            <button onClick={increment}>Increment</button>
          </p>
        </div>
      }
      </div>
  );
}
