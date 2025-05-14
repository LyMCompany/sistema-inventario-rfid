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
    const agrupados = codigosBarras.map((item) => ({
      Codigo: item.Codigo,
      Cantidad: item.Cantidad,
    }));
  
    const inventario = JSON.parse(localStorage.getItem(`inventarioBase_${empresa}`)) || [];
    let resultados = [];
  
    agrupados.forEach((scan) => {
      const { Codigo, Cantidad: cantidadEscaneada } = scan;
      const invItem = inventario.find((item) => item.Codigo === Codigo);
  
      if (invItem) {
        const cantidadInventario = parseInt(invItem.Cantidad);
        const diferencia = cantidadInventario - cantidadEscaneada;
        const absDiff = Math.abs(diferencia);
  
        if (diferencia < 0) {
          // Escaneados más que inventario → No Registrado
          resultados.push({
            ...invItem,
            Cantidad: absDiff,
            Estado: 'No Registrado',
          });
        } else if (diferencia > 0) {
          // Escaneados menos que inventario → Faltante
          resultados.push({
            ...invItem,
            Cantidad: absDiff,
            Estado: 'Faltante',
          });
        }
  
        // En todos los casos válidos, se encontraron los que coinciden
        resultados.push({
          ...invItem,
          Cantidad: Math.min(cantidadEscaneada, cantidadInventario),
          Estado: 'Encontrado',
        });
  
      } else {
        // Código completamente desconocido
        resultados.push({
          Nombre: '-',
          Codigo: Codigo,
          SKU: '-',
          Marca: '-',
          RFID: '-',
          Ubicacion: '-',
          Cantidad: cantidadEscaneada,
          Estado: 'No Registrado',
        });
      }
    });
  
    setResultadosComparacion(resultados);
  
    const encontrados = resultados.filter((r) => r.Estado === 'Encontrado').length;
    const faltantes = resultados.filter((r) => r.Estado === 'Faltante').length;
    const noRegistrados = resultados.filter((r) => r.Estado === 'No Registrado').length;
  
    Swal.fire({
      title: 'Resultado de la Comparación',
      html: `
        <p><strong>Encontrados:</strong> ${encontrados}</p>
        <p><strong>Faltantes:</strong> ${faltantes}</p>
        <p><strong>No Registrados:</strong> ${noRegistrados}</p>
      `,
      icon: 'info',
    });
  
      // Cambiar la vista para mostrar los resultados
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
