// Run:
// `npx create-react-app secret-dapp`
// `cd secret-dapp`
// `yarn add secretjs` (or `npm i secretjs`)
// Then copy the content of this file into `src/App.js`

import React, { useState, useEffect } from "react";
const { SecretNetworkClient } = require("secretjs");

const DENOM = 'SCRT';
const MINIMAL_DENOM = 'uscrt';

// Testnet
// const GRPCWEB_URL = 'https://grpc.pulsar.scrttestnet.com';
// const LCD_URL = 'https://api.pulsar.scrttestnet.com';
// const RPC_URL = 'https://rpc.pulsar.scrttestnet.com';
// const CHAIN_ID = 'pulsar-2';
// const CHAIN_NAME = 'Secret Testnet'; 

// secretdev / local secret
const CHAIN_NAME = 'Local Testnet';  //Anything you want
const LCD_URL = 'http://localhost:1317';
const RPC_URL = 'http://localhost:26657';
const CHAIN_ID = "secretdev-1";

export default function App() {
  const [myAddress, setMyAddress] = useState("");
  const [balance, setBalance] = useState();
  const [keplrReady, setKeplrReady] = useState(false);

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
      
      const {
        balance: { amount },
      } = await secretjs.query.bank.balance(
        {
          address: myAddress,
          denom: MINIMAL_DENOM,
        }
      );
      setBalance(new Intl.NumberFormat("en-US", {}).format(amount / 1e6))

      setKeplrReady(true);
      setMyAddress(myAddress);
      
    }
      getKeplr();
      
    return () => {};
  }, []);
  

  return (
    <div className="App">
      <h1>Secret Dapp</h1>

      {!keplrReady ? 
          <h1>Waiting for Keplr wallet integration...</h1>
      : 
        <div>
          <p>
            <strong>My Address:</strong> {myAddress}
          </p>
          <p>
            <strong>Balance:</strong> {balance} SCRT
          </p>
        </div>
      }
      </div>
  );
}