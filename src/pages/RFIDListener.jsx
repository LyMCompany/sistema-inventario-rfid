// src/pages/RFIDListener.jsx
import { useEffect } from 'react';

function RFIDListener({ onEtiquetaLeida }) {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      console.log('[RFIDListener] Conectado al WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data); // ✅ no usar .text()
        if (parsed.codigo) {
          onEtiquetaLeida(parsed.codigo);
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

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [onEtiquetaLeida]); // ✅ ahora estable y no recrea el efecto

  return null;
}

export default RFIDListener;
