const WebSocket = require('ws');

const PORT = process.env.PORT || 3001;
const wss = new WebSocket.Server({ port: PORT });


let clients = [];

wss.on('connection', (ws) => {
  clients.push(ws);

  ws.on('message', (msg) => {
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

console.log(`✅ Servidor WebSocket activo en el puerto ${PORT}`);
