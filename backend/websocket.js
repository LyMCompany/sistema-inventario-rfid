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
  const payload = {
    tipo: 'inventario',
    usuario,
    empresa,
    inventario
  };

  const json = JSON.stringify(payload);

  sockets.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(json); // ✅ Enviar directamente como objeto, no dentro de otra propiedad
    }
  });

  console.log(`📦 Inventario enviado por WebSocket (${sockets.length} clientes)`);
}


module.exports = {setupWebSocket, emitirInventario};
