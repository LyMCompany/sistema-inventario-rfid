// frontend/src/pages/EscanadorBarras.jsx

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import '../styles/ControlInventario.css';
import { useUser } from '../context/UserContext';



function EscanadorBarras() {
  const { logout, user } = useUser();
  const empresa = user?.empresa || 'Empresa no definida';

  const [codigosBarras, setCodigosBarras] = useState([]);
  const [resultadosComparacion, setResultadosComparacion] = useState([]);
  const [vistaActiva, setVistaActiva] = useState('escanear');

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

  const compararConInventario = () => {
    setVistaActiva('comparar');
    const inventario = JSON.parse(localStorage.getItem(`inventarioBase_${empresa}`)) || [];
    let encontrados = 0;
    let noRegistrados = 0;

    const faltantes = inventario.filter(prod => {
        return !codigosBarras.find(item => item.Codigo === prod.Codigo);
      });
      

    const nuevosResultados = codigosBarras.map(item => {
      const encontrado = inventario.find(prod => prod.Codigo === item.Codigo);
      if (encontrado) {
        encontrados++;
        return {
          Nombre: encontrado.Nombre || '-',
          Codigo: encontrado.Codigo || '-',
          SKU: encontrado.SKU || '-',
          Marca: encontrado.Marca || '-',
          RFID: encontrado.RFID || '-',
          Ubicacion: encontrado.Ubicacion || '-',
          Estado: 'Encontrado'
        };
      } else {
        noRegistrados++;
        return {
          Nombre: '-',
          Codigo: item.Codigo,
          SKU: '-',
          Marca: '-',
          RFID: '-',
          Ubicacion: '-',
          Estado: 'No Registrado'
        };
      }
    });

    setResultadosComparacion(nuevosResultados);

    const nuevoReporte = {
      usuario: user?.correo,
      empresa: empresa,
      fecha: new Date().toLocaleString(),
      encontrados: nuevosResultados.filter(e => e.Estado === 'Encontrado'),
      faltantes: [],
      no_registrados: nuevosResultados.filter(e => e.Estado === 'No Registrado')
    };

    const reportesPrevios = JSON.parse(localStorage.getItem('reportesComparacion')) || [];
    reportesPrevios.push(nuevoReporte);
    localStorage.setItem('reportesComparacion', JSON.stringify(reportesPrevios));

    Swal.fire({
        title: 'Resultado de la Comparación',
        html: `
          <p><strong>Encontrados:</strong> ${encontrados}</p>
          <p><strong>Faltantes:</strong> ${faltantes.length}</p>
          <p><strong>No Registrados:</strong> ${noRegistrados}</p>
        `,
        icon: 'info'
      });
      
  };

  const subirReporte = async () => {
    const reporte = {
      usuario: user?.correo,
      empresa: empresa,
      fecha: new Date().toLocaleString(),
      encontrados: resultadosComparacion.filter(e => e.Estado === 'Encontrado'),
      faltantes: [],
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


      <div className="header">
        <button onClick={logout}>Cerrar sesión</button>
        <span className="usuario">{user?.nombre} - {empresa}</span>
      </div>

      <h2>Escanear Etiqueta</h2>
      <div className="acciones">
        <button onClick={escanearCodigoBarra}>Iniciar Escaneo</button>
        <button onClick={compararConInventario}>Comparar con Inventario</button>
        <button onClick={subirReporte}>Subir Reporte</button>
        <button onClick={exportarResultados}>Exportar Resultados</button>
        <button onClick={limpiarTabla}>Limpiar Tabla</button>
      </div>

      {vistaActiva === 'escanear' && (
        <div className="tabla">
          <h3>Artículos Escaneados</h3>
          <table>
            <thead>
              <tr>
                <th>N.º</th>
                <th>Código de Barra</th>
                <th>Cantidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {codigosBarras.map((item, index) => (
                <tr key={index}>
                  <td>{item.ID}</td>
                  <td>{item.Codigo}</td>
                  <td onClick={() => editarCantidad(index)} style={{ cursor: 'pointer', color: 'blue' }}>
                    {item.Cantidad}
                  </td>
                  <td>{item.Estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {vistaActiva === 'comparar' && resultadosComparacion.length > 0 && (
        <div className="tabla">
          <h3>Resultado de Comparación</h3>
          <table>
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
              {resultadosComparacion.map((item, index) => (
                <tr key={index}>
                  <td>{item.Nombre}</td>
                  <td>{item.Codigo}</td>
                  <td>{item.SKU}</td>
                  <td>{item.Marca}</td>
                  <td>{item.RFID}</td>
                  <td>{item.Ubicacion}</td>
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
