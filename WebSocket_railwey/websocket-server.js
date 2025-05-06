// websocket-server.js
const WebSocket = require('ws');
const PORT = process.env.PORT || 3001;

const wss = new WebSocket.Server({ port: PORT });
let clients = [];

wss.on('connection', (ws) => {
  clients.push(ws);

  ws.on('message', (msg) => {
    // Reenviar a todos menos al emisor
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
