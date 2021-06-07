// Run:
// `npx create-react-app secret-dapp`
// `cd secret-dapp`
// `yarn add secretjs` (or `npm i secretjs`)
// Then copy the content of this file into `src/App.js`

import React from "react";
import { SigningCosmWasmClient } from "secretjs";

const CHIAN_ID = "enigma-pub-testnet-3";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = { keplrReady: false, account: null };
  }

  async componentDidMount() {
    await this.setupKeplr();

    const account = await this.secretjs.getAccount(this.state.account.address);
    this.setState({ account });
  }

  async setupKeplr() {
    // Define sleep
    const sleep = (ms) => new Promise((accept) => setTimeout(accept, ms));

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
    // This works well with `enigmampc/secret-network-sw-dev`:
    //     - https://hub.docker.com/r/enigmampc/secret-network-sw-dev
    //     - Run a local chain: `docker run -it --rm -p 26657:26657 -p 26656:26656 -p 1337:1337 -v $(shell pwd):/root/code --name secretdev enigmampc/secret-network-sw-dev`
    //     - `alias secretcli='docker exec -it secretdev secretcli'`
    //     - Store a contract: `docker exec -it secretdev secretcli tx compute store /root/code/contract.wasm.gz --from a --gas 10000000 -b block -y`
    // On holodeck, set:
    //     1. CHIAN_ID = "holodeck-2"
    //     2. rpc = "ttp://chainofsecrets.secrettestnet.io:26657"
    //     3. rest = "https://chainofsecrets.secrettestnet.io"
    //     4. chainName = Whatever you like
    // For more examples, go to: https://github.com/chainapsis/keplr-example/blob/master/src/main.js
    await window.keplr.experimentalSuggestChain({
      chainId: CHIAN_ID,
      chainName: "Local Secret Chain",
      rpc: "http://localhost:26657",
      rest: "http://localhost:1337",
      bip44: {
        coinType: 529,
      },
      coinType: 529,
      stakeCurrency: {
        coinDenom: "SCRT",
        coinMinimalDenom: "uscrt",
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
          coinDenom: "SCRT",
          coinMinimalDenom: "uscrt",
          coinDecimals: 6,
        },
      ],
      feeCurrencies: [
        {
          coinDenom: "SCRT",
          coinMinimalDenom: "uscrt",
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
    await window.keplr.enable(CHIAN_ID);

    // Setup SecrtJS with Keplr's OfflineSigner
    // This pops-up a window for the user to sign on each tx we sent
    this.keplrOfflineSigner = window.getOfflineSigner(CHIAN_ID);
    const accounts = await this.keplrOfflineSigner.getAccounts();

    this.secretjs = new SigningCosmWasmClient(
      "http://localhost:1337", // holodeck - https://chainofsecrets.secrettestnet.io; mainnet - user your LCD/REST provider
      accounts[0].address,
      this.keplrOfflineSigner,
      window.getEnigmaUtils(CHIAN_ID),
      {
        // 300k - Max gas units we're willing to use for init
        init: {
          amount: [{ amount: "300000", denom: "uscrt" }],
          gas: "300000",
        },
        // 300k - Max gas units we're willing to use for exec
        exec: {
          amount: [{ amount: "300000", denom: "uscrt" }],
          gas: "300000",
        },
      }
    );

    this.setState({ keplrReady: true, account: accounts[0] });
  }

  render() {
    if (!this.state.keplrReady) {
      return (
        <>
          <h1>Waiting for Keplr wallet integration...</h1>
        </>
      );
    }

    let account = <h1>Account: unknown</h1>;
    if (this.state.account) {
      account = <h1>Account: {this.state.account.address}</h1>;
    }

    let balance = <>Balance: 0 SCRT</>;
    try {
      balance = (
        <>
          Balance:{" "}
          {new Intl.NumberFormat("en-US", {}).format(
            +this.state.account.balance[0].amount / 1e6
          )}{" "}
          SCRT
        </>
      );
    } catch (e) {}

    return (
      <>
        {account}
        {balance}
      </>
    );
  }
}

export default App;
