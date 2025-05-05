import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/AdminPanel.css';

const BACKEND_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL
  : 'https://backend-inventario-t3yr.onrender.com';



function AdminPanel() {
  const { user, logout } = useUser(); // ✅ extrae solo lo que existe en tu UserContext

  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/usuarios`, {
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

  const handleLogout = async () => {
    const confirm = await Swal.fire({
      title: '¿Deseas cerrar sesión?',
      text: 'Se cerrará tu sesión actual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    });
  
    if (confirm.isConfirmed) {
      logout();      // ✅ llama correctamente la función del contexto
      navigate('/');
    }
  };
  
  
  const handleEditar = async (usuario) => {
    const { value: formValues } = await Swal.fire({
      title: 'Editar Usuario',
      html:
        `<input id="nombre" class="swal2-input" placeholder="Nombre" value="${usuario.nombre || ''}">` +
        `<input id="apellidos" class="swal2-input" placeholder="Apellidos" value="${usuario.apellidos || ''}">` +
        `<input id="telefono" class="swal2-input" placeholder="Teléfono" value="${usuario.telefono || ''}">` +
        `<select id="rol" class="swal2-input">
          <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>admin</option>
          <option value="user" ${usuario.rol === 'user' ? 'selected' : ''}>user</option>
        </select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar cambios',
      preConfirm: () => {
        const nombre = document.getElementById('nombre').value;
        const apellidos = document.getElementById('apellidos').value;
        const telefono = document.getElementById('telefono').value;
        const rol = document.getElementById('rol').value;
  
        if (!nombre || !apellidos || !telefono) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }
  
        return { nombre, apellidos, telefono, rol };
      }
    });
  
    if (formValues) {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/editar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            correo: usuario.correo, // identificador
            ...formValues
          })
        });
  
        if (response.ok) {
          await Swal.fire('Actualizado', 'Usuario editado correctamente.', 'success');
          fetchUsuarios(); // refrescar la tabla
        } else {
          Swal.fire('Error', 'No se pudo actualizar el usuario.', 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Error en el servidor o conexión', 'error');
      }
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
        const response = await fetch(`${BACKEND_URL}/auth/eliminar`, {
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
    <div className="admin-panel-container">
      {/* Encabezado azul */}
      <div className="admin-header">
        <div>Panel de Administración</div>
        <div className="usuario-info">
          Usuario: {user?.nombre || 'Admin'}
          <button onClick={handleLogout} className="cerrar-sesion">Cerrar sesión</button>
        </div>
      </div>

      {/* Selector centrado */}
      <div className="empresa-select-container">
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
      </div>

      {/* Tabla de usuarios */}
      {empresaSeleccionada && (
        <div className="usuario-info">
          <table>
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
                                   
                      <button onClick={() => handleEditar(usuario)}>Editar</button>{' '}
                      <button onClick={() => handleEliminar(usuario.correo)}>Eliminar</button>
                  </td>
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
