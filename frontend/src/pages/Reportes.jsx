import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import '../styles/Reportes.css';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

function Reportes() {
  const { user } = useUser();
  const empresa = user?.empresa || 'Empresa no definida';

  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  useEffect(() => {
    const cargarReportes = async () => {
      try {
        const response = await fetch(
          `https://backend-inventario-t3yr.onrender.com/reportes?usuario=${user.correo}&empresa=${user.empresa}`
        );
        const data = await response.json();
        setReportes(data);
      } catch (error) {
        console.error('Error al cargar reportes:', error);
      }
    };

    cargarReportes();
  }, [user]);

  useEffect(() => {
    const ahora = new Date();
    const tresMesesMs = 1000 * 60 * 60 * 24 * 90;
    const todos = JSON.parse(localStorage.getItem(`reportesComparacion_${empresa}`)) || [];
    const propios = todos.filter(
      r => r.usuario === user.username && r.empresa === user.empresa && ahora - new Date(r.fecha) <= tresMesesMs
    );

    setReportes(prev => [...prev, ...propios]);

  }, [empresa]);

  const exportarReporte = (reporte) => {
    const agregarInfo = (item, tipo) => ({
      Nombre: item.Nombre || '-',
      Codigo: item.Codigo || '-',
      SKU: item.SKU || '-',
      Marca: item.Marca || '-',
      RFID: String(item.RFID || item.codigo || '-'),
      Ubicacion: item.Ubicacion || '-',
      Estado: item.Estado || tipo, // como fallback
      Fecha: reporte.fecha,
      Usuario: reporte.usuario,
    });
  
    const data = ['encontrados', 'faltantes', 'no_registrados']
      .flatMap(tipo =>
        (reporte[tipo] || []).map(item => agregarInfo(item, tipo))
      );
  
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    const nombre = `Reporte_${reporte.usuario}_${reporte.fecha.replace(/[/:, ]/g, '_')}.xlsx`;
    XLSX.writeFile(wb, nombre);
  };
  

  const eliminarReporte = async (fecha) => {
    // Verifica si es un reporte del backend (tiene _id por ejemplo)
    if (reporteSeleccionado._id) {
      try {
        const response = await fetch(`https://backend-inventario-t3yr.onrender.com/reportes/${reporteSeleccionado._id}`, {
          method: 'DELETE'
        });
  
        if (!response.ok) throw new Error('Error al eliminar desde backend');
  
        // Filtra en estado frontend
        setReportes(prev => prev.filter(r => r._id !== reporteSeleccionado._id));
        Swal.fire('Eliminado', 'Reporte eliminado correctamente', 'success');
      } catch (error) {
        console.error('Error al eliminar reporte del backend:', error);
        Swal.fire('Error', 'No se pudo eliminar el reporte del servidor', 'error');
      }
    } else {
      // Eliminar desde localStorage
      const todos = JSON.parse(localStorage.getItem(`reportesComparacion_${empresa}`)) || [];
      const nuevos = todos.filter(r => !(r.usuario === user.username && r.empresa === user.empresa && r.fecha === fecha));
      localStorage.setItem(`reportesComparacion_${empresa}`, JSON.stringify(nuevos));
      setReportes(prev => prev.filter(r => !(r.usuario === user.username && r.empresa === user.empresa && r.fecha === fecha)));
      Swal.fire('Eliminado', 'Reporte eliminado correctamente', 'success');
    }
  
    setReporteSeleccionado(null);
  };
  

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro que deseas salir?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.removeItem('usuario');
        navigate('/');
      }
    });
  };

  const handleVolver = () => navigate('/dashboard');

  return (
    <div className="reporte-container">
      <div className="control-header">
        <div className="left-actions">
          <button className="btn-regresar" onClick={handleVolver}>Regresar</button>
        </div>
        <div className="user-info">
          <span className="user-icon">👤</span>
          <span className="username">{empresa}</span>
          <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>

      <h2>Reportes de Comparación</h2>

      <div className="barra-reportes">
        <select value={reporteSeleccionado ? reporteSeleccionado.fecha : ''} 
          onChange={(e) => {
            const seleccionado = reportes.find(r => r.fecha === e.target.value);
            setReporteSeleccionado(seleccionado);
          }}
        >
          <option value="">Selecciona un reporte</option>
          {reportes.map((r, i) => (
            <option key={i} value={r.fecha}>
              {new Date(r.fecha).toLocaleString()} - {r.usuario}
            </option>
          ))}
        </select>
        <button className="btn-limpiar-reportes" onClick={limpiarTodosMisReportes}>Limpiar Mis Reportes</button>
      </div>

      {reporteSeleccionado && (
        <div className="tabla-contenedor">
          <div className="acciones-reporte">
            <button onClick={() => exportarReporte(reporteSeleccionado)}>Exportar Reporte</button>
            <button onClick={() => eliminarReporte(reporteSeleccionado.fecha)} className="btn-eliminar-reporte">Eliminar Este Reporte</button>
          </div>

          {reporteSeleccionado !== null && (
            <div className="tabla-reporte">
              <h3>Encontrados</h3>
              <ul>
                {reporteSeleccionado.encontrados.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <h3>Faltantes</h3>
              <ul>
                {reporteSeleccionado.faltantes.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <h3>No Registrados</h3>
              <ul>
                {reporteSeleccionado.no_registrados.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

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
              {['encontrados', 'faltantes', 'no_registrados'].flatMap(tipo =>
                (reporteSeleccionado?.[tipo] || []).map((item, index) => (
                  <tr key={`${tipo}-${index}`}>
                    <td>{item.Nombre || '-'}</td>
                    <td>{item.Codigo || '-'}</td>
                    <td>{item.SKU || '-'}</td>
                    <td>{item.Marca || '-'}</td>
                    <td>{item.RFID || item.codigo || '-'}</td>
                    <td>{item.Ubicacion || '-'}</td>
                    <td>{item.Estado}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Reportes;
