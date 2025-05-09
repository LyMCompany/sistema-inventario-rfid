// src/pages/RFIDListener.jsx
import { useEffect } from 'react';

function RFIDListener({ onEtiquetaLeida }) {
  useEffect(() => {
    const ws = new WebSocket('wss://rfid-websocket-server-production.up.railway.app');

    ws.onopen = () => {
      console.log('[RFIDListener] Conectado al WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data); // ✅ recibir como JSON
        if (parsed.codigo) {
          onEtiquetaLeida(parsed.codigo); // ✅ llama al manejador con el código escaneado
        }
      } catch (err) {
        console.error('[RFIDListener] Error al parsear mensaje:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[RFIDListener] Error de WebSocket:', err);
    };

    ws.onclose = () => {
      console.warn('[RFIDListener] Conexión WebSocket cerrada');
    };

    // Limpiar WebSocket al desmontar componente
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [onEtiquetaLeida]); // ✅ efecto estable, no se reinicia innecesariamente

  return null;
}

export default RFIDListener;
