const { SecretNetworkClient } = require("secretjs");

window.onload = async () => {
  this.chainId = "pulsar-2";

  // Keplr extension injects the offline signer that is compatible with cosmJS.
  // You can get this offline signer from `window.getOfflineSigner(chainId:string)` after load event.
  // And it also injects the helper function to `window.keplr`.
  // If `window.getOfflineSigner` or `window.keplr` is null, Keplr extension may be not installed on browser.
  if (!window.getOfflineSigner || !window.keplr) {
    alert("Please install keplr extension");
  } else {
    if (window.keplr.experimentalSuggestChain) {
      try {
        // Setup Secret Testnet (not needed on mainnet)
        // Keplr v0.6.4 introduces an experimental feature that supports the feature to suggests the chain from a webpage.
        // cosmoshub-3 is integrated to Keplr so the code should return without errors.
        // The code below is not needed for cosmoshub-3, but may be helpful if you’re adding a custom chain.
        // If the user approves, the chain will be added to the user's Keplr extension.
        // If the user rejects it or the suggested chain information doesn't include the required fields, it will throw an error.
        // If the same chain id is already registered, it will resolve and not require the user interactions.
        await window.keplr.experimentalSuggestChain({
          chainId: this.chainId,
          chainName: "Secret Testnet",
          rpc: "https://rpc.pulsar.scrttestnet.com",
          rest: "https://api.pulsar.scrttestnet.com",
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

        // This method will ask the user whether or not to allow access if they haven't visited this website.
        // Also, it will request user to unlock the wallet if the wallet is locked.
        // If you don't request enabling before usage, there is no guarantee that other methods will work.
        await window.keplr.enable(this.chainId);

        // @ts-ignore
        const keplrOfflineSigner = window.getOfflineSigner(this.chainId);
        const accounts = await keplrOfflineSigner.getAccounts();

        this.address = accounts[0].address;
        this.secretjs = await SecretNetworkClient.create({
          grpcWebUrl: "https://grpc.pulsar.scrttestnet.com",
          chainId: this.chainId,
          wallet: keplrOfflineSigner,
          walletAddress: this.address,
          encryptionUtils: window.getEnigmaUtils(this.chainId),
        });
      } catch (error) {
        console.error(error);
      }
    } else {
      alert("Please use the recent version of keplr extension");
    }
  }

  document.getElementById("address").append(this.address);

  const {
    balance: { amount },
  } = await this.secretjs.query.bank.balance({
    address: this.address,
    denom: 'uscrt',
  });
  document
    .getElementById("accBalance")
    .append(`${new Intl.NumberFormat("en-US", {}).format(amount / 1e6)}`);
};

document.sendForm.onsubmit = () => {
  let recipient = document.sendForm.recipient.value;
  let sendAmount = document.sendForm.amount.value;

  sendAmount = parseFloat(sendAmount);
  if (isNaN(sendAmount)) {
    alert("Invalid amount");
    return false;
  }

  sendAmount *= 1000000;
  sendAmount = Math.floor(sendAmount);

  (async () => {
    await window.keplr.enable(this.chainId);

    const {
        balance: { amount },
    } = await this.secretjs.query.bank.balance({
        address: this.address,
        denom: 'uscrt',
    });

    if (!amount || parseFloat(amount) < sendAmount) {
        alert("Insufficient balance to send, get some funds from the faucet");
        return false;
    }

    const result = await this.secretjs.tx.bank.send(
      {
        amount: [{ amount: sendAmount.toString(), denom: "uscrt" }],
        fromAddress: this.address,
        toAddress: recipient, // Set recipient to sender for testing
      },
      {
        gasLimit: 20000,
        gasPriceInFeeDenom: 0.25,
        memo: "send tokens example",
      }
    );

    if (result.code !== undefined && result.code !== 0) {
      alert("Failed to send tx: " + result.log || result.rawLog);
    } else {
      alert(
        "Successfully sent tx: https://explorer.secrettestnet.io/transactions/" +
          result.transactionHash
      );
    }
  })();

  return false;
};
