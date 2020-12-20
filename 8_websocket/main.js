const WebSocket = require('ws');

require('dotenv').config();

const main = async () => {
    const ws = new WebSocket(process.env.SECRET_WS_URL);

    // consume all events for the compute module
    let query = `message.module='compute'`
    
    // 1. Listen only for compute events matching code_id
    // const CODE_ID = 121;
    // query = query + ` AND message.code_id='${CODE_ID}'`;

    // 2. Listen for contract instantiations
    // query = query + ` AND message.action='instantiate'`;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          jsonrpc: "2.0",
          method: "subscribe",
          params: {
            query,
          },
          id: "banana", // jsonrpc id
        })
      );
    };

    ws.onmessage = async ({ data }) => {
      try {
        const { result } = JSON.parse(data);

        console.log(result);

      } catch (e) {
        console.error(e);
      }
    };
}

main().then(resp => {
    console.log(resp);
}).catch(err => {
    console.log(err);
})
