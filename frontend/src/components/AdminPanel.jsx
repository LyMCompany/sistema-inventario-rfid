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
          admin: true
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
      html: `
        <input id="nombre" class="swal2-input" placeholder="Nombre" value="${usuario.nombre}">
        <input id="apellidos" class="swal2-input" placeholder="Apellidos" value="${usuario.apellidos}">
        <input id="correo" class="swal2-input" placeholder="Correo" value="${usuario.correo}" readonly>
        <input id="empresa" class="swal2-input" placeholder="Empresa" value="${usuario.empresa}" readonly>
        <input id="telefono" class="swal2-input" placeholder="Teléfono" value="${usuario.telefono}">
        <select id="rol" class="swal2-select">
          <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>admin</option>
          <option value="usuario" ${usuario.rol === 'usuario' ? 'selected' : ''}>usuario</option>
        </select>
        <input id="contrasena" class="swal2-input" placeholder="Nueva contraseña (opcional)" type="password">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar cambios',
      preConfirm: () => {
        const nombre = document.getElementById('nombre').value.trim();
        const apellidos = document.getElementById('apellidos').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const rol = document.getElementById('rol').value;
        const contrasena = document.getElementById('contrasena').value.trim();
  
        if (!nombre || !apellidos || !telefono || !rol) {
          Swal.showValidationMessage('Todos los campos excepto contraseña son obligatorios');
          return false;
        }
  
        return { nombre, apellidos, telefono, rol, contrasena };
      }
    });
  
    if (formValues) {
      try {
        const payload = {
          correo: usuario.correo,
          nombre: formValues.nombre,
          apellidos: formValues.apellidos,
          telefono: formValues.telefono,
          rol: formValues.rol,
        };
  
        if (formValues.contrasena) {
          const encoder = new TextEncoder();
          const buffer = encoder.encode(formValues.contrasena);
          const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          payload.contrasena = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
  
        const response = await fetch(`${BACKEND_URL}/auth/editar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
  
        if (response.ok) {
          await Swal.fire('Actualizado', 'El usuario ha sido actualizado correctamente.', 'success');
          fetchUsuarios();
        } else {
          Swal.fire('Error', 'No se pudo actualizar el usuario.', 'error');
        }
      } catch (error) {
        console.error('Error al actualizar usuario:', error);
        Swal.fire('Error', 'Error de red o del servidor.', 'error');
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
