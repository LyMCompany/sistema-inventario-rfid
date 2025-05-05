import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/AdminPanel.css';

function AdminPanel() {
  const { user, logout } = useUser();
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
  

  const handleEliminar = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el usuario permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/usuarios/${id}`, {
          method: 'DELETE',
        });

        const data = await res.json();

        if (res.ok) {
          Swal.fire('Eliminado', data.mensaje, 'success');
          fetchUsuarios();
        } else {
          Swal.fire('Error', data.mensaje, 'error');
        }
      } catch (error) {
        console.error('Error eliminando usuario:', error);
      }
    }
  };

  const usuariosFiltrados = usuarios.filter(u => u.empresa === empresaSeleccionada);

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        Usuario: {user?.nombre || 'Admin'} |{' '}
        <button
          onClick={logout}
          style={{
            color: '#fff',
            marginLeft: 10,
            background: 'transparent',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <h2>Panel de Administración</h2>

      <select
        className="empresa-select"
        value={empresaSeleccionada}
        onChange={(e) => setEmpresaSeleccionada(e.target.value)}
      >
        <option value="">Seleccionar empresa</option>
        {empresas.map((empresa, idx) => (
          <option key={idx} value={empresa}>{empresa}</option>
        ))}
      </select>

      {empresaSeleccionada && (
        <div className="usuario-info">
          <h3>Usuarios registrados en {empresaSeleccionada}</h3>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellidos</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map(usuario => (
                <tr key={usuario.id}>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.apellidos}</td>
                  <td>{usuario.correo}</td>
                  <td>{usuario.telefono}</td>
                  <td>{usuario.rol}</td>
                  <td className="botones-acciones">
                    <button onClick={() => alert('Editar no implementado')}>Editar</button>
                    <button onClick={() => alert('Cambiar contraseña no implementado')}>Contraseña</button>
                    <button onClick={() => handleEliminar(usuario.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>No hay usuarios en esta empresa.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
