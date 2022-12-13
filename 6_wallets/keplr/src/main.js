const { SecretNetworkClient } = require('secretjs');

window.onload = async () => {
    this.chainId = 'pulsar-2';

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
                    chainName: 'Secret Testnet',
                    rpc: 'https://rpc.pulsar.scrttestnet.com',
                    rest: 'https://api.pulsar.scrttestnet.com',
                    bip44: {
                        coinType: 529,
                    },
                    coinType: 529,
                    stakeCurrency: {
                        coinDenom: 'SCRT',
                        coinMinimalDenom: 'uscrt',
                        coinDecimals: 6,
                    },
                    bech32Config: {
                        bech32PrefixAccAddr: 'secret',
                        bech32PrefixAccPub: 'secretpub',
                        bech32PrefixValAddr: 'secretvaloper',
                        bech32PrefixValPub: 'secretvaloperpub',
                        bech32PrefixConsAddr: 'secretvalcons',
                        bech32PrefixConsPub: 'secretvalconspub',
                    },
                    currencies: [
                        {
                            coinDenom: 'SCRT',
                            coinMinimalDenom: 'uscrt',
                            coinDecimals: 6,
                        },
                    ],
                    feeCurrencies: [
                        {
                            coinDenom: 'SCRT',
                            coinMinimalDenom: 'uscrt',
                            coinDecimals: 6,
                        },
                    ],
                    gasPriceStep: {
                        low: 0.1,
                        average: 0.25,
                        high: 0.4,
                    },
                    features: ['secretwasm'],
                });

                // This method will ask the user whether or not to allow access if they haven't visited this website.
                // Also, it will request user to unlock the wallet if the wallet is locked.
                // If you don't request enabling before usage, there is no guarantee that other methods will work.
                await window.keplr.enable(this.chainId);

                // @ts-ignore
                const keplrOfflineSigner = window.getOfflineSignerOnlyAmino(this.chainId);
                const accounts = await keplrOfflineSigner.getAccounts();
                
                this.address = accounts[0].address;

                window.secretjs = new SecretNetworkClient({
                  url: 'https://api.pulsar.scrttestnet.com',
                  chainId: this.chainId,
                  wallet: keplrOfflineSigner,
                  walletAddress: this.address,
                  encryptionUtils: window.keplr.getEnigmaUtils(this.chainId),
                });
            } catch (error) {
                console.error(error)
            }
        } else {
            alert("Please use the recent version of keplr extension");
        }
    }

    document.getElementById("address").append(this.address);

    // Show balance if available
    if (this.address) {
        // For testing this assumes a new account with only uscrt in the list of balances
        document.getElementById("balance").append(`${await getScrt(this.address)}`);
    } else {
        document.getElementById("balance").append('0 USCRT');
    }
};

async function getScrt(address) {
  console.log(window.secretjs);
  const { balance: { amount } } = await window.secretjs.query.bank.balance(
    {
      address,
      denom: "uscrt",
    });
  
    if (amount === undefined) {
        return "0 SCRT"
    } else {
        let resultAmount = amount > 0 ? amount / 10**6 : 0;
        return `${resultAmount} SCRT`;
    }
}

document.sendForm.onsubmit = () => {
    let recipient = document.sendForm.recipient.value;
    let amount = document.sendForm.amount.value;

    amount = parseFloat(amount);
    if (isNaN(amount)) {
        alert("Invalid amount");
        return false;
    }

    amount *= 1000000;
    amount = Math.floor(amount);

    (async () => {
        await window.keplr.enable(this.chainId);
        const tx = await window.secretjs.tx.bank.send(
          {
            from_address: this.address,
            to_address: recipient,
            amount: [{ denom: "uscrt", amount: amount.toString() }],
          },
          {
            gasLimit: "20000",
          }
        );
        if (tx.code !== undefined &&
          tx.code !== 0) {
            alert("Failed to send tx: " + tx.log || tx.rawLog);
        } else {
            alert("Successfully sent tx: https://https://secretnodes.com/pulsar/transactions/" + tx.transactionHash);
        }
    })();

    return false;
};
