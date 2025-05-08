// backend/websocket.js
let sockets = [];

function setupWebSocket(server) {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('🔌 Cliente WebSocket conectado');
    sockets.push(ws);

    ws.on('close', () => {
      console.log('❌ Cliente desconectado');
      sockets = sockets.filter(s => s !== ws);
    });
  });

  return wss;
}

function emitirEtiqueta(codigo) {
  const payload = JSON.stringify({ codigo });
  sockets.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  });
  console.log(`📡 Código enviado a ${sockets.length} clientes: ${codigo}`);
}

module.exports = { setupWebSocket, emitirEtiqueta };
