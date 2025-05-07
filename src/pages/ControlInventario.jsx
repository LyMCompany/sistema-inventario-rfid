import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useInventario } from '../context/InventarioContext';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import '../styles/ControlInventario.css';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import RFIDListener from './RFIDListener';

function ControlInventario() {
  const { logout } = useUser();
  const { inventarioBase, setInventarioBase } = useInventario();
  const { username, user } = useUser();
  const empresa = user?.empresa || 'default';

  const navigate = useNavigate();

  const [escaneados, setEscaneados] = useState(() => {
    const saved = localStorage.getItem(`escaneados_${empresa}`);
    return saved ? JSON.parse(saved) : [];
  });
  const codigosSet = useRef(new Set(escaneados.map(e => String(e.codigo))));

  const [comparacion, setComparacion] = useState(() => {
    const saved = localStorage.getItem(`comparacion_${empresa}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [fechaComparacion, setFechaComparacion] = useState(() => {
    const saved = localStorage.getItem(`fechaComparacion_${empresa}`);
    return saved || null;
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [mostrarImportados, setMostrarImportados] = useState(false);

  const onEtiquetaLeida = useCallback((codigo) => {
    const codigoStr = String(codigo);
    if (!codigosSet.current.has(codigoStr)) {
      codigosSet.current.add(codigoStr);
      setEscaneados(prev => {
        const nuevos = [...prev, { codigo: codigoStr }];
        localStorage.setItem(`escaneados_${empresa}`, JSON.stringify(nuevos));
        return nuevos;
      });
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`inventarioBase_${empresa}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setInventarioBase(parsed);
    } else {
      setInventarioBase([]);
    }
  }, [setInventarioBase]);

  useEffect(() => {
    let ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => console.log('[RFIDListener] WebSocket conectado');
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.codigo) onEtiquetaLeida(parsed.codigo);
      } catch (err) {
        console.error('[RFIDListener] Error al parsear mensaje:', err);
      }
    };
    ws.onerror = (err) => console.error('[RFIDListener] Error de WebSocket:', err);
    ws.onclose = () => {
      console.warn('[RFIDListener] Conexión WebSocket cerrada. Reintentando...');
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws = new WebSocket('ws://localhost:8080');
        }
      }, 5000);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [onEtiquetaLeida]);

  const handleBack = () => navigate('/dashboard');

  const handleLogout = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Vas a cerrar sesión',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        logout(); // ✅ Llama al método del contexto
        navigate('/');
      }
    });
  };
  

  const handleComparar = () => {
    setMostrarImportados(false);
    const actualBase = localStorage.getItem(`inventarioBase_${empresa}`);
    const base = actualBase ? JSON.parse(actualBase) : [];

    if (base.length === 0) {
      Swal.fire('Error', 'Primero debes cargar el inventario base', 'error');
      return;
    }

    setInventarioBase(base);
    setIsProcessing(true);

    const encontrados = [];
    const sobrantes = [];
    const faltantesMap = new Map(base.map(item => [String(item.RFID), item]));

    const nuevosEscaneados = escaneados.map(scan => {
      const codigo = String(scan.codigo);
      if (faltantesMap.has(codigo)) {
        const encontrado = faltantesMap.get(codigo);
        encontrados.push({ ...encontrado, Estado: 'Encontrado' });
        faltantesMap.delete(codigo);
        return { ...scan, Estado: 'Encontrado' };
      } else {
        sobrantes.push({ RFID: codigo, Estado: 'Sobrante' });
        return { ...scan, Estado: 'Sobrante' };
      }
    });

    const faltantesMarcados = Array.from(faltantesMap.values()).map(item => ({ ...item, Estado: 'Faltante' }));

    const resultadoFinal = {
      encontrados,
      faltantes: faltantesMarcados,
      sobrantes,
    };

    setEscaneados(nuevosEscaneados);
    localStorage.setItem('escaneados', JSON.stringify(nuevosEscaneados));
    setComparacion(resultadoFinal);
    localStorage.setItem(`comparacion_${empresa}`, JSON.stringify(resultadoFinal));

    const fecha = new Date().toLocaleString();
    setFechaComparacion(fecha);
    localStorage.setItem(`fechaComparacion_${empresa}`, fecha);

    const reportes = JSON.parse(localStorage.getItem(`reportesComparacion_${empresa}`)) || [];
    reportes.push({ usuario: username || 'Desconocido', fecha, ...resultadoFinal });
    localStorage.setItem(`reportesComparacion_${empresa}`, JSON.stringify(reportes));

    setIsProcessing(false);

    Swal.fire(
      'Comparación completada',
      `Encontrados: ${encontrados.length}, Faltantes: ${faltantesMarcados.length}, Sobrantes: ${sobrantes.length}`,
      'info'
    );
  };

  const handleExportar = () => {
    if (!comparacion) {
      Swal.fire('Error', 'No hay resultados para exportar', 'error');
      return;
    }

    setIsProcessing(true);

    const agregarInfoExtra = (item) => ({
      ...item,
      RFID: String(item.RFID || item.codigo || '-'),
      Fecha: fechaComparacion,
      Usuario: username || 'Desconocido',
    });

    const dataFinal = [
      ...comparacion.encontrados.map(agregarInfoExtra),
      ...comparacion.faltantes.map(agregarInfoExtra),
      ...comparacion.sobrantes.map(agregarInfoExtra),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataFinal);
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');

    const nombreArchivo = `ComparacionInventario_${username}_${fechaComparacion.replace(/[/:, ]/g, '_')}.xlsx`;
    try {
      XLSX.writeFile(wb, nombreArchivo);
      Swal.fire('Éxito', 'Archivo exportado', 'success');
    } catch (error) {
      console.error('Error al exportar:', error);
      Swal.fire('Error', 'No se pudo exportar el archivo', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLimpiarEscaneados = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Estas seguro que quieres borrar la lista de Artículos Importados?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        codigosSet.current.clear();
        setEscaneados([]);
        localStorage.removeItem(`escaneados_${empresa}`);
        Swal.fire('Limpieza exitosa', 'Se ha borrado la lista de artículos importados.', 'success');
      }
    });
  };

  const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto).then(() => {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Copiado al portapapeles',
        showConfirmButton: false,
        timer: 1000,
      });
    });
  };

  return (
    <div className="control-container">
      <RFIDListener onEtiquetaLeida={onEtiquetaLeida} />
      <div className="control-header">
        <div className="left-actions">
          <button className="btn-regresar" onClick={handleBack}>Regresar</button>
        </div>
        <div className="user-info">
          <span className="user-icon">👤</span>
          <span className="username">{username || 'Invitado'}</span>
          <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>

      <h2>Control de Inventario</h2>

      <div className="control-buttons">
        <button onClick={() => {
          const codigo = prompt('Escanea o escribe el código:');
          if (codigo && !codigosSet.current.has(String(codigo))) {
            codigosSet.current.add(String(codigo));
            setEscaneados(prev => {
              const nuevos = [...prev, { codigo: String(codigo) }];
              localStorage.setItem('escaneados', JSON.stringify(nuevos));
              return nuevos;
            });
            Swal.fire('Éxito', 'Artículo escaneado', 'success');
          } else if (codigo) {
            Swal.fire('Advertencia', 'El artículo ya fue escaneado', 'warning');
          }
        }}>Escanear</button>

        <button onClick={handleComparar} disabled={isProcessing}>
          {isProcessing ? 'Procesando...' : 'Comparar'}
        </button>

        <button onClick={handleExportar} disabled={isProcessing}>
          {isProcessing ? 'Exportando...' : 'Exportar Resultados'}
        </button>

        <button onClick={() => {
          setMostrarImportados(true);
          setComparacion(null);
        }}>
          Artículos Importados
        </button>

        <button onClick={handleLimpiarEscaneados} disabled={isProcessing}>
          Limpiar Importados
        </button>
      </div>

      {comparacion && (
        <div className="tabla-contenedor">
          <h3>Resultados de la Comparación</h3>
          <table className="tabla-comparacion">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>SKU</th>
                <th>Marca</th>
                <th>RFID</th>
                <th>Ubicación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {[...comparacion.encontrados, ...comparacion.faltantes, ...comparacion.sobrantes].map((item, index) => (
                <tr key={index}>
                  <td>{item.Nombre || '-'}</td>
                  <td>{item.Codigo || '-'}</td>
                  <td>{item.SKU || '-'}</td>
                  <td>{item.Marca || '-'}</td>
                  <td className="celda-rfid">
                  <button onClick={() => copiarAlPortapapeles(String(item.RFID || item.codigo || '-'))}
                   style={{ background: 'none', border: 'none', padding: 0, color: 'blue', textDecoration: 'underline', cursor: 'pointer', wordBreak: 'break-word', whiteSpace: 'normal' }}
                  >
                   {String(item.RFID || item.codigo || '-')}
                  </button>
                  </td>
                  <td>{item.Ubicacion || '-'}</td>
                  <td>{item.Estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mostrarImportados && (
        <div className="tabla-contenedor">
          <h3>Artículos Importados</h3>
          <table className="tabla-comparacion">
            <thead>
              <tr>
                <th>#</th>
                <th>Código RFID</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {escaneados.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                  <button
  onClick={() => copiarAlPortapapeles(String(item.codigo))}
  style={{ background: 'none', border: 'none', padding: 0, color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
>
  {String(item.codigo)}
</button>

                  </td>
                  <td>{item.Estado || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ControlInventario;
