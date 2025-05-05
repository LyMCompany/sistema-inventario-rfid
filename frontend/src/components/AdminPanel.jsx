import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/AdminPanel.css';

function AdminPanel() {
  const { username, setUsername, user } = useUser();
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
          empresa: user?.empresa || '',
          correo: user?.correo || ''
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : [];

      if (Array.isArray(data)) {
        setUsuarios(data);
        const empresasUnicas = [...new Set(data.map(u => u.empresa))];
        setEmpresas(empresasUnicas);
      }
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const handleLogout = () => {
    setUsername('');
    navigate('/');
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
      {/* Banner azul */}
      <div className="encabezado">
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Panel de Administración</div>
        <div>
          Usuario: {user?.nombre || 'Admin'}{' '}
          <button onClick={handleLogout} className="cerrar-sesion">Cerrar sesión</button>
        </div>
      </div>

      {/* Selector centrado */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <select
          className="empresa-selector"
          value={empresaSeleccionada}
          onChange={(e) => setEmpresaSeleccionada(e.target.value)}
        >
          <option value="">Seleccionar empresa</option>
          {empresas.map((empresa, index) => (
            <option key={index} value={empresa}>{empresa}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
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
