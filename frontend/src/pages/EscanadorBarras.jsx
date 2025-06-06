// frontend/src/pages/EscanadorBarras.jsx

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import '../styles/ControlInventario.css';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

function EscanadorBarras() {
  const { logout, user } = useUser();
  const navigate = useNavigate();
  const empresa = user?.empresa ?? 'Empresa no definida';

  const [codigosBarras, setCodigosBarras] = useState(() => {
    const guardados = localStorage.getItem(`escaneados_barras_${empresa}`);
    return guardados ? JSON.parse(guardados) : [];
  });

  const [resultadosComparacion, setResultadosComparacion] = useState([]);
  const [vistaActiva, setVistaActiva] = useState('escanear');

  useEffect(() => {
    localStorage.setItem(`escaneados_barras_${empresa}`, JSON.stringify(codigosBarras));
  }, [codigosBarras, empresa]);

  const handleBack = () => {
    navigate('/control-inventario');
  };

  const agregarCodigoBarra = (codigo) => {
    setCodigosBarras((prev) => {
      const index = prev.findIndex(item => item.Codigo === codigo);
      if (index !== -1) {
        const copia = [...prev];
        copia[index].Cantidad += 1;
        return copia;
      } else {
        return [...prev, {
          ID: prev.length + 1,
          Codigo: codigo,
          Cantidad: 1,
          Estado: 'Escaneado'
        }];
      }
    });
  };

  const escanearCodigoBarra = async () => {
    setVistaActiva('escanear');
    const { value: codigo } = await Swal.fire({
      title: 'Escanear Código de Barra',
      input: 'text',
      inputLabel: 'Ingrese el código de barra o escanéelo directamente',
      inputPlaceholder: 'Ej: 1234567890',
      showCancelButton: true
    });

    if (codigo) {
      agregarCodigoBarra(codigo);
      escanearCodigoBarra();
    }
  };

  const exportarResultados = () => {
    const hoja = XLSX.utils.json_to_sheet(resultadosComparacion);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Resultado Comparación');
    XLSX.writeFile(libro, 'resultado_comparacion_barras.xlsx');
  };

  const limpiarTabla = () => {
    setCodigosBarras([]);
    localStorage.removeItem(`escaneados_barras_${empresa}`);
    Swal.fire('Limpieza Exitosa', 'Tabla de artículos escaneados limpiada.', 'success');
  };

  const editarCantidad = async (index) => {
    const { value: nuevaCantidad } = await Swal.fire({
      title: 'Editar Cantidad',
      input: 'number',
      inputLabel: 'Nueva cantidad para este código',
      inputValue: codigosBarras[index].Cantidad,
      showCancelButton: true
    });
  
    if (nuevaCantidad !== undefined && nuevaCantidad !== null && nuevaCantidad !== '') {
      setCodigosBarras((prev) => {
        const copia = [...prev];
        copia[index].Cantidad = parseInt(nuevaCantidad);
        return copia;
      });
    }
  };

  const eliminarCodigo = (index) => {
    Swal.fire({
      title: '¿Eliminar este artículo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setCodigosBarras((prev) => prev.filter((_, i) => i !== index));
      }
    });
  };

  const compararConInventario = () => {
    const claveEmpresa = user?.empresa?.trim() ?? 'EmpresaNoDefinida';
    const claveInventario = `inventarioBase_${claveEmpresa}`;
    const claveEscaneados = `escaneados_barras_${claveEmpresa}`;

    const inventario = JSON.parse(localStorage.getItem(claveInventario)) || [];
    const escaneados = JSON.parse(localStorage.getItem(claveEscaneados)) || [];

    if (!inventario.length) {
        Swal.fire('Inventario vacío', 'No se encontró inventario para esta empresa.', 'warning');
        return;
    }

    if (!escaneados.length) {
        Swal.fire('Sin escaneos', 'No se han escaneado códigos aún.', 'warning');
        return;
    }

    const resultados = [];
    const inventarioMap = new Map();
    inventario.forEach(item => {
        inventarioMap.set(item.Codigo, { ...item, CantidadDisponible: parseInt(item.Cantidad || 1) });
    });

    const conteoEscaneados = {};
    escaneados.forEach(item => {
        conteoEscaneados[item.Codigo] = (conteoEscaneados[item.Codigo] || 0) + parseInt(item.Cantidad || 1);
    });

    for (const codigoEscaneado in conteoEscaneados) {
        const cantidadEscaneada = conteoEscaneados[codigoEscaneado];
        const itemInventario = inventarioMap.get(codigoEscaneado);
        let cantidadEncontradaTotal = 0;

        if (itemInventario) {
            const cantidadEncontrada = Math.min(cantidadEscaneada, itemInventario.CantidadDisponible);
            if (cantidadEncontrada > 0) {
                resultados.push({
                    ...itemInventario,
                    Cantidad: cantidadEncontrada,
                    Estado: 'Encontrado'
                });
                inventarioMap.set(codigoEscaneado, { ...itemInventario, CantidadDisponible: itemInventario.CantidadDisponible - cantidadEncontrada });
                cantidadEncontradaTotal = cantidadEncontrada;
            }
            const cantidadNoRegistrada = cantidadEscaneada - cantidadEncontrada;
            if (cantidadNoRegistrada > 0) {
                resultados.push({
                    ...itemInventario, // Usamos los datos del inventario aquí
                    Cantidad: cantidadNoRegistrada,
                    Estado: 'No Registrado'
                });
            }
        } else {
            resultados.push({
                Nombre: '-',
                Codigo: codigoEscaneado,
                SKU: '-',
                Marca: '-',
                RFID: '-',
                Ubicacion: '-',
                Cantidad: cantidadEscaneada,
                Estado: 'No Registrado'
            });
        }
    }

    // Identificar los faltantes
    for (const [codigo, itemInventario] of inventarioMap.entries()) {
        if (itemInventario.CantidadDisponible > 0) {
            resultados.push({
                ...itemInventario,
                Cantidad: itemInventario.CantidadDisponible,
                Estado: 'Faltante'
            });
        }
    }

    // Agrupar resultados por código y estado para sumar cantidades
    const resultadosAgrupados = [];
    const agrupacionMap = new Map();

    resultados.forEach(item => {
        const clave = `${item.Codigo}-${item.Estado}`;
        if (agrupacionMap.has(clave)) {
            agrupacionMap.get(clave).Cantidad += item.Cantidad;
        } else {
            agrupacionMap.set(clave, { ...item });
        }
    });

    resultadosAgrupados.push(...agrupacionMap.values());

    const resultadosFiltrados = resultadosAgrupados.filter(r => parseInt(r.Cantidad) > 0);
    setResultadosComparacion(resultadosFiltrados);

    const encontrados = resultadosFiltrados.filter(r => r.Estado === 'Encontrado').reduce((sum, item) => sum + parseInt(item.Cantidad), 0);
    const faltantes = resultadosFiltrados.filter(r => r.Estado === 'Faltante').reduce((sum, item) => sum + parseInt(item.Cantidad), 0);
    const noRegistrados = resultadosFiltrados.filter(r => r.Estado === 'No Registrado').reduce((sum, item) => sum + parseInt(item.Cantidad), 0);

    Swal.fire({
        title: 'Resultado de la Comparación',
        html: `
            <p><strong>Encontrados:</strong> ${encontrados}</p>
            <p><strong>Faltantes:</strong> ${faltantes}</p>
            <p><strong>No Registrados:</strong> ${noRegistrados}</p>
        `,
        icon: 'info',
    });

    setVistaActiva('comparar');
};

  const subirReporte = async () => {
    const reporte = {
      usuario: user?.correo,
      empresa: empresa,
      fecha: new Date().toLocaleString(),
      encontrados: resultadosComparacion.filter(e => e.Estado === 'Encontrado'),
      faltantes: resultadosComparacion.filter(e => e.Estado === 'Faltante'),
      no_registrados: resultadosComparacion.filter(e => e.Estado === 'No Registrado')
    };

    try {
      const response = await fetch('https://backend-inventario-t3yr.onrender.com/reportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reporte)
      });

      if (response.ok) {
        Swal.fire('Éxito', 'Reporte subido correctamente.', 'success');
      } else {
        throw new Error('Error al subir el reporte');
      }
    } catch (error) {
      console.error('Error al subir reporte:', error);
      Swal.fire('Error', 'No se pudo subir el reporte.', 'error');
    }
  };

  return (
    <div className="control-inventario">
      <div className="control-header">
        <div className="left-actions">
          <button className="btn-regresar" onClick={handleBack}>Regresar</button>
        </div>
        <div className="user-info">
        <span className="user-icon">👤</span>
        <span className="username">{user?.empresa ?? 'Empresa no definida'}</span>
        <button className="btn-logout" onClick={() => {
            logout();
            navigate('/');
            }}>Cerrar sesión</button>

        </div>



      </div>

      <h2>Escanear Etiqueta</h2>
      <div className="control-buttons">
        <button onClick={escanearCodigoBarra}>Iniciar Escaneo</button>
        <button onClick={compararConInventario}>Comparar con Inventario</button>
        <button onClick={subirReporte}>Subir Reporte</button>
        <button onClick={exportarResultados}>Exportar Resultados</button>
        <button onClick={limpiarTabla}>Limpiar Tabla</button>
      </div>

                {vistaActiva === 'escanear' && (
                <div className="tabla-contenedor">
                <h3>Artículos Escaneados</h3>
                <table className="tabla-inventario">
                <thead>
                <tr>
                    <th>N.º</th>
                    <th>Código de Barra</th>
                    <th>Cantidad</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {codigosBarras.map((item, index) => (
                    <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.Codigo}</td>
                    <td
                        onClick={() => editarCantidad(index)}
                        style={{ cursor: 'pointer', color: 'blue' }}
                    >
                        {item.Cantidad}
                    </td>
                    <td>{item.Estado}</td>
                    <td>
                        <button
                        onClick={() => eliminarCodigo(index)}
                        style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        >
                        Eliminar
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>

                </table>
            </div>
            )}


                {vistaActiva === 'comparar' && resultadosComparacion.length > 0 && (
                <div className="tabla-contenedor">
                    <h3><b>Resultado de Comparación</b></h3>
                    <table className="tabla-comparacion">
                    <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Código</th>
                        <th>SKU</th>
                        <th>Marca</th>
                        <th>RFID</th>
                        <th>Ubicación</th>
                        <th>Cantidad</th>
                        <th>Estado</th>
                    </tr>
                    </thead>
                    <tbody>
                        {resultadosComparacion.map((item, index) => (
                        <tr key={index}>
                            <td>{item.Nombre}</td>
                            <td>{item.Codigo}</td>
                            <td>{item.SKU}</td>
                            <td>{item.Marca}</td>
                            <td>{item.RFID}</td>
                            <td>{item.Ubicacion}</td>
                            <td>{item.Cantidad}</td>
                            <td>{item.Estado}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                )}

    </div>
  );
}
export default EscanadorBarras;
