// src/pages/SimuladorRFID.jsx
import React, { useState, useRef, useEffect } from 'react';

function SimuladorRFID() {
  const [contador, setContador] = useState(0);
  const ws = useRef(null);
  const codigosGenerados = useRef(new Set());

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => {
      console.log('[SimuladorRFID] Conectado al WebSocket (Simulador)');
    };

    ws.current.onerror = (e) => {
      console.error('[SimuladorRFID] Error:', e);
    };

    ws.current.onclose = () => {
      console.warn('[SimuladorRFID] WebSocket cerrado');
    };

    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  const enviarEtiqueta = (codigo) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket no está listo para enviar mensajes');
      return;
    }
    const mensaje = JSON.stringify({ codigo });
    ws.current.send(mensaje);
    setContador(prev => prev + 1);
  };

  const generarCodigo = () => {
    let codigo;
    do {
      const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
      codigo = `RFID${random}`;
    } while (codigosGenerados.current.has(codigo));
    codigosGenerados.current.add(codigo);
    return codigo;
  };

  const enviarUnaEtiqueta = () => {
    const codigo = generarCodigo();
    enviarEtiqueta(codigo);
  };

  const enviarCienEtiquetas = async (delay = 100) => {
    for (let i = 0; i < 100; i++) {
      const codigo = generarCodigo();
      enviarEtiqueta(codigo);
      await new Promise(resolve => setTimeout(resolve, delay)); // Aumentar delay evita sobrecarga
    }
  };

  const esCodigoValido = (codigo) => {
    return typeof codigo === 'string' && codigo.startsWith('RFID');
  };

  return (
    <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px dashed gray' }}>
      <h4>
        🧪 <strong>Simulador de RFID</strong> <span style={{ color: 'red' }}>(modo prueba - solo desarrollo)</span>
      </h4>
      <p>Total etiquetas simuladas enviadas: <strong>{contador}</strong></p>
      <button onClick={enviarUnaEtiqueta}>Enviar etiqueta simulada</button>{' '}
      <button onClick={enviarCienEtiquetas}>📦 Enviar 100 etiquetas simuladas</button>
    </div>
  );
}

export default SimuladorRFID;
