import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

function AdminPanel() {
  const { username, setUsername } = useUser();
  const [usuarios, setUsuarios] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('https://backend-inventario-t3yr.onrender.com/usuarios')
      .then(res => res.json())
      .then(data => {
        setUsuarios(data);
        const empresasUnicas = [...new Set(data.map(u => u.empresa))];
        setEmpresas(empresasUnicas);
      })
      .catch(err => console.error(err));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUsername('');
    navigate('/');
  };

  const handleEliminar = async (id) => { /* sin cambios */ };
  const handleEditar = async (usuario) => { /* sin cambios */ };
  const handleCambiarContrasena = async (usuario) => { /* sin cambios */ };

  const usuariosFiltrados = empresaSeleccionada
    ? usuarios.filter(u => u.empresa === empresaSeleccionada)
    : [];

  return (
    <div className="dashboard-container">
      {/* Encabezado superior */}
      <div className="header">
        <span className="user-info">👤 {username}</span>
        <button className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <div className="dashboard-header">
        <h2 className="dashboard-title">Panel de Administración</h2>
      </div>

      <div className="dropdown-container">
        <label className="mr-2 font-medium">Selecciona una empresa:</label>
        <select
          className="select-dropdown"
          value={empresaSeleccionada}
          onChange={(e) => setEmpresaSeleccionada(e.target.value)}
        >
          <option value="">-- Seleccionar --</option>
          {empresas.map((empresa, index) => (
            <option key={index} value={empresa}>{empresa}</option>
          ))}
        </select>
      </div>

      {usuariosFiltrados.length > 0 ? (
        <div className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Empresa</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map(usuario => (
                <tr key={usuario.id}>
                  <td>{usuario.nombre} {usuario.apellidos}</td>
                  <td>{usuario.correo}</td>
                  <td>{usuario.empresa}</td>
                  <td>{usuario.telefono}</td>
                  <td>{usuario.rol}</td>
                  <td>
                    <button className="edit-button" onClick={() => handleEditar(usuario)}>Editar</button>
                    <button className="password-button" onClick={() => handleCambiarContrasena(usuario)}>Contraseña</button>
                    <button className="delete-button" onClick={() => handleEliminar(usuario.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : empresaSeleccionada ? (
        <p className="dashboard-message">No hay usuarios registrados en esta empresa.</p>
      ) : (
        <p className="dashboard-message">Selecciona una empresa para ver los usuarios.</p>
      )}
    </div>
  );
}

export default AdminPanel;
