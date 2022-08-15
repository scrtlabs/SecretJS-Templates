const { SecretNetworkClient, MsgSend } = require("secretjs");

const CHAIN_ID = 'pulsar-2';
const CHAIN_NAME = 'Secret Testnet';
const GRPCWEB_URL = 'https://grpc.pulsar.scrttestnet.com';
const RPC_URL = 'https://rpc.pulsar.scrttestnet.com';
const LCD_URL = 'https://api.pulsar.scrttestnet.com';

// Uncomment for local secret
// const CHAIN_NAME = 'Local Testnet';  //Anything you want
// const GRPCWEB_URL = 'http://localhost:9091';
// const LCD_URL = 'http://localhost:1317';
// const RPC_URL = 'http://localhost:26657';
// const CHAIN_ID = "secretdev-1";
const DENOM = 'SCRT';
const MINIMAL_DENOM = 'uscrt';

window.onload = async () => {

    // Keplr extension injects the offline signer that is compatible with cosmJS.
    // You can get this offline signer from `window.getOfflineSigner(chainId:string)` after load event.
    // And it also injects the helper function to `window.keplr`.
    // If `window.getOfflineSigner` or `window.keplr` is null, Keplr extension may be not installed on browser.
    if (!window.getEnigmaUtils || !window.keplr || !window.getOfflineSignerOnlyAmino) {
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

                // This method will ask the user whether or not to allow access if they haven't visited this website.
                // Also, it will request user to unlock the wallet if the wallet is locked.
                // If you don't request enabling before usage, there is no guarantee that other methods will work.
                await window.keplr.enable(CHAIN_ID);
                
            } catch (error) {
                console.error(error)
            }
        } else {
            alert("Please use the recent version of keplr extension");
        }
        const keplrOfflineSigner = window.getOfflineSignerOnlyAmino(CHAIN_ID);
        const accounts = await keplrOfflineSigner.getAccounts();
        
        this.account = accounts[0];
        this.address = this.account.address;

        this.secretjs = await SecretNetworkClient.create({
            grpcWebUrl: GRPCWEB_URL,
            wallet: keplrOfflineSigner,
            walletAddress: this.address,
            chainId: CHAIN_ID,
            encryptionUtils: window.getEnigmaUtils(CHAIN_ID)
        });

        document.getElementById("scrtAddress").append(this.address);

        // Show balance if available
        if (this.account) {
            // For testing this assumes a new account with only uscrt in the list of balances
            document.getElementById("balance").append(`${await getScrt(this.secretjs, this.address)}`);
        } else {
            document.getElementById("balance").append('0 USCRT');
        }
    };
}

async function getScrt(secretjs, address) {
    if (address === undefined) {
        return "0 SCRT"
    } else {
        const {
            balance: { amount },
        } = await secretjs.query.bank.balance(
            {
            address: address,
            denom: MINIMAL_DENOM,
            }
        );
        return `${amount > 0 ? amount / 10**6 : 0} SCRT`;
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
        const result = await this.secretjs.tx.bank.send(
        {
            fromAddress: this.address,
            toAddress: recipient,
            amount: [{ denom: "uscrt", amount: `${amount}` }],
        },
        {
            gasLimit: 20000,
        },
        );
        
        if (result.code !== undefined &&
            result.code !== 0) {
            alert("Failed to send tx: " + result.log || result.rawLog);
        } else {
            alert("Successfully sent tx: https://testnet.ping.pub/secret/tx/" + result.transactionHash);
            const balance = await getScrt(this.secretjs, this.address);
            document.getElementById("balance").innerHTML = `${balance}`;
        }
    })();

    return false;
};
