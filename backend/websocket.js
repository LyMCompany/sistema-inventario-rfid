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

function emitirInventario(inventario, usuario, empresa) {
  const payload = JSON.stringify({
    tipo: 'inventario',
    usuario,
    empresa,
    inventario
  });

  sockets.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  });

  console.log(`📦 Inventario enviado por WebSocket a ${sockets.length} clientes`);
}


module.exports = {setupWebSocket, emitirInventario};
