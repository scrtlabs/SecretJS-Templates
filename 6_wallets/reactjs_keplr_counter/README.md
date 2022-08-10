

- ReactJS + Keplr for the secret counter contract deployed in example 5

### To create your own Dapp:
 `npx create-react-app secret-dapp`

 `cd secret-dapp`
 
 `yarn add secretjs@beta` (or `npm i secretjs@beta`)

### Then copy the content of the App.js in this folder, into your project's `src/App.js`

### Start Local Secret
`docker run -it -p 9091:9091 -p 26657:26657 -p 1317:1317 -p 5000:5000 --name localsecret ghcr.io/scrtlabs/localsecret:v1.3.1` 

### Start your app
`yarn start` (or `npm start`)
