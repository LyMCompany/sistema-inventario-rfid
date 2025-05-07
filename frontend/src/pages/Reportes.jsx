import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import '../styles/Reportes.css';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

function Reportes() {
  const { username, user } = useUser();
  const empresa = user?.empresa || 'default';
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  useEffect(() => {
    const ahora = new Date();
    const tresMesesMs = 1000 * 60 * 60 * 24 * 90;
    const todos = JSON.parse(localStorage.getItem(`reportesComparacion_${empresa}`)) || [];
    const propios = todos.filter(r => r.usuario === username && ahora - new Date(r.fecha) <= tresMesesMs);

    setReportes(propios);
  }, [username]);

  const exportarReporte = (reporte) => {
    const agregarInfo = (item) => ({
      ...item,
      RFID: String(item.RFID || item.codigo || '-'),
      Fecha: reporte.fecha,
      Usuario: reporte.usuario,
    });

    const data = [
      ...reporte.encontrados.map(agregarInfo),
      ...reporte.faltantes.map(agregarInfo),
      ...reporte.sobrantes.map(agregarInfo),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    const nombre = `Reporte_${reporte.usuario}_${reporte.fecha.replace(/[/:, ]/g, '_')}.xlsx`;
    XLSX.writeFile(wb, nombre);
  };

  const eliminarReporte = (fecha) => {
    const todos = JSON.parse(localStorage.getItem(`reportesComparacion_${empresa}`)) || [];
    const nuevos = todos.filter(r => !(r.usuario === username && r.fecha === fecha));
    localStorage.setItem(`reportesComparacion_${empresa}`, JSON.stringify(nuevos));
    
    setReportes(nuevos.filter(r => r.usuario === username));
    setReporteSeleccionado(null);
  };

  const limpiarTodosMisReportes = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esto eliminará todos tus reportes guardados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const todos = JSON.parse(localStorage.getItem(`reportesComparacion_${empresa}`)) || [];
        const filtrados = todos.filter(r => r.usuario !== username);
        localStorage.setItem(`reportesComparacion_${empresa}`, JSON.stringify(filtrados));

        setReportes([]);
        setReporteSeleccionado(null);
        Swal.fire('Eliminados', 'Tus reportes han sido eliminados.', 'success');
      }
    });
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
          <span className="username">{username}</span>
          <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>

      <h2>Reportes de Comparación</h2>

      <div className="barra-reportes">
        <select
          value={reporteSeleccionado ? reporteSeleccionado.fecha : ''}
          onChange={(e) => {
            const seleccionado = reportes.find(r => r.fecha === e.target.value);
            setReporteSeleccionado(seleccionado);
          }}
        >
          <option value="">Selecciona un reporte</option>
          {reportes.map((r, i) => (
            <option key={i} value={r.fecha}>
              {r.fecha} - {r.usuario}
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
              {['encontrados', 'faltantes', 'sobrantes'].flatMap(tipo =>
                reporteSeleccionado[tipo].map((item, index) => (
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
