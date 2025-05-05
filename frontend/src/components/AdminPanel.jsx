import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useUser } from '../context/UserContext';
import '../styles/AdminPanel.css';

function AdminPanel() {
  const { user, setUsername } = useUser();
  const [usuarios, setUsuarios] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('');
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    if (!user?.empresa) return;

    fetch('https://backend-inventario-t3yr.onrender.com/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa: user.empresa })
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.text();
          console.error('Error de respuesta:', error);
          throw new Error('Error al obtener usuarios');
        }
        return res.json();
      })
      .then(data => {
        setUsuarios(data);
        const empresasUnicas = [...new Set(data.map(u => u.empresa))];
        setEmpresas(empresasUnicas);
      })
      .catch(err => {
        console.error('Error en fetch:', err);
        Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
      });
  }, [user?.empresa]);

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
        setUsername('');
        window.location.href = '/';
      }
    });
  };

  const usuariosFiltrados = empresaSeleccionada
    ? usuarios.filter(u => u.empresa === empresaSeleccionada)
    : [];

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <span className="username">{user?.nombre || 'Admin'}</span>
        <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <h2>Panel de Administración</h2>

      <select
        className="empresa-select"
        value={empresaSeleccionada}
        onChange={(e) => setEmpresaSeleccionada(e.target.value)}
      >
        <option value="">Seleccionar empresa</option>
        {empresas.map((empresa, index) => (
          <option key={index} value={empresa}>{empresa}</option>
        ))}
      </select>

      {usuariosFiltrados.length > 0 && (
        <div className="usuario-info">
          <h3>Usuarios Registrados</h3>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Empresa</th>
                <th>Teléfono</th>
                <th>Rol</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
