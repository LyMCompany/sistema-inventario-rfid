// server.js
const WebSocket = require('ws');

// Crear el servidor WebSocket en el puerto 8080
const wss = new WebSocket.Server({ port: 8080 });

console.log('[Backend] Servidor WebSocket escuchando en ws://localhost:8080');

// Manejo de nuevas conexiones
wss.on('connection', (ws) => {
  console.log('[Backend] Cliente conectado');

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);

      if (parsed.codigo && typeof parsed.codigo === 'string') {
        console.log(`[Backend] Código recibido: ${parsed.codigo}`);

        // 🔁 Reenviar el código RFID a todos los clientes excepto al emisor
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ codigo: parsed.codigo }));
          }
        });

        // Confirmación opcional al emisor (puedes quitar esto si no te interesa)
        ws.send(JSON.stringify({ status: 'ok', recibido: parsed.codigo }));
      } else {
        console.warn('[Backend] Mensaje inválido recibido:', parsed);
        ws.send(JSON.stringify({ status: 'error', mensaje: 'Formato inválido o falta de "codigo"' }));
      }
    } catch (err) {
      console.error('[Backend] Error al procesar mensaje:', err);
      ws.send(JSON.stringify({ status: 'error', mensaje: 'Error al procesar el mensaje' }));
    }
  });

  ws.on('close', () => {
    console.log('[Backend] Cliente desconectado');
  });

  ws.on('error', (err) => {
    console.error('[Backend] Error de conexión:', err);
  });
});
