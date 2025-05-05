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
    fetch('https://backend-inventario-t3yr.onrender.com/usuarios')
      .then(async res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then(data => {
        setUsuarios(data);
        const empresasUnicas = [...new Set(data.map(u => u.empresa))];
        setEmpresas(empresasUnicas);
      })
      .catch(err => {
        console.error('Error cargando usuarios:', err);
        setUsuarios([]);
        setEmpresas([]);
      });
  }, []);

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
        {user?.nombre || 'Admin'} | <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
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
