window.onload = async () => {
    
    let ws = new WebSocket(process.env.SECRET_WS_URL);

    ws.onopen = function(e) {
        console.log("[open] Connection established");
        
        // consume all events for the compute module
        let query = `message.module='compute'`

        // 1. Listen only for compute events matching code_id
        // const CODE_ID = 121;
        // query = query + ` AND message.code_id='${CODE_ID}'`;

        // 2. Listen for contract instantiations
        // query = query + ` AND message.action='instantiate'`;
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
      
      ws.onmessage = function(event) {
        document.getElementById('message').textContent = event.data;
      };
      
      ws.onclose = function(event) {
        if (event.wasClean) {
          alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
          // e.g. server process killed or network down
          // event.code is usually 1006 in this case
          alert('[close] Connection died');
        }
      };
      
      ws.onerror = function(error) {
        alert(`[error] ${error.message}`);
      };
       
};
