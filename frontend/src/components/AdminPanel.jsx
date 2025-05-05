import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/AdminPanel.css';

function AdminPanel() {
  const { username, logout, user } = useUser();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa: username,
          correo: user?.correo || '',
        }),
      });

      if (!response.ok) {
        console.error('Respuesta no OK:', response.status);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setUsuarios(data);
        const empresasUnicas = [...new Set(data.map(u => u.empresa))];
        setEmpresas(empresasUnicas);
      } else {
        console.error('Respuesta inesperada:', data);
      }
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const handleEliminar = async (correo) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el usuario permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/eliminar`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo }),
        });

        if (response.ok) {
          setUsuarios(usuarios.filter(u => u.correo !== correo));
          Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success');
        } else {
          Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Error al eliminar el usuario.', 'error');
      }
    }
  };

  return (
    <div className="admin-panel">
      <div className="header">
        <div className="user-info">
          <span>Usuario: {user?.nombre || 'Admin'}</span>
          <button className="logout-button" onClick={logout}>Cerrar sesión</button>
        </div>
        <h2 className="title">Panel de Administración</h2>
      </div>

      <div className="empresa-selector">
        <select value={empresaSeleccionada} onChange={(e) => setEmpresaSeleccionada(e.target.value)}>
          <option value="">Seleccionar empresa</option>
          {empresas.map((empresa, index) => (
            <option key={index} value={empresa}>{empresa}</option>
          ))}
        </select>
      </div>

      {empresaSeleccionada && (
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellidos</th>
              <th>Correo</th>
              <th>Empresa</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.filter(u => u.empresa === empresaSeleccionada).map((usuario, index) => (
              <tr key={index}>
                <td>{usuario.nombre}</td>
                <td>{usuario.apellidos}</td>
                <td>{usuario.correo}</td>
                <td>{usuario.empresa}</td>
                <td>{usuario.telefono}</td>
                <td>{usuario.rol}</td>
                <td>
                  <button onClick={() => handleEliminar(usuario.correo)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminPanel;