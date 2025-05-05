import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useUser } from '../context/UserContext';
import { FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
  const { user, setUsername } = useUser();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('');
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    fetch('https://backend-inventario-t3yr.onrender.com/auth/usuarios', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa: user.empresa })
    })
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

  const handleEliminar = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Este usuario se eliminará permanentemente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (confirm.isConfirmed) {
      try {
        await fetch(`https://backend-inventario-t3yr.onrender.com/auth/usuarios/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ empresa: user.empresa })
        });
        setUsuarios(prev => prev.filter(u => u.id !== id));
        Swal.fire('Eliminado', 'Usuario eliminado correctamente', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
      }
    }
  };

  const handleEditar = async (usuario) => {
    const { value: formValues } = await Swal.fire({
      title: `Editar usuario: ${usuario.nombre}`,
      html: `
        <input id="swal-nombre" class="swal2-input" placeholder="Nombre" value="${usuario.nombre}">
        <input id="swal-apellidos" class="swal2-input" placeholder="Apellidos" value="${usuario.apellidos}">
        <input id="swal-correo" class="swal2-input" placeholder="Correo" value="${usuario.correo}">
        <input id="swal-empresa" class="swal2-input" placeholder="Empresa" value="${usuario.empresa}">
        <input id="swal-telefono" class="swal2-input" placeholder="Teléfono" value="${usuario.telefono}">
      `,
      focusConfirm: false,
      preConfirm: () => {
        return {
          nombre: document.getElementById('swal-nombre').value,
          apellidos: document.getElementById('swal-apellidos').value,
          correo: document.getElementById('swal-correo').value,
          empresa: document.getElementById('swal-empresa').value,
          telefono: document.getElementById('swal-telefono').value,
        };
      }
    });

    if (formValues) {
      try {
        await fetch(`https://backend-inventario-t3yr.onrender.com/auth/usuarios/${usuario.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formValues, empresa: user.empresa }),
        });
        Swal.fire('Actualizado', 'Usuario actualizado correctamente', 'success');
        setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, ...formValues } : u));
      } catch (error) {
        Swal.fire('Error', 'No se pudo actualizar el usuario', 'error');
      }
    }
  };

  const handleCambiarContrasena = async (usuario) => {
    const { value: nuevaPassword } = await Swal.fire({
      title: `Cambiar contraseña de ${usuario.nombre}`,
      input: 'password',
      inputLabel: 'Nueva contraseña',
      inputPlaceholder: 'Escribe la nueva contraseña',
      inputAttributes: {
        maxlength: 50,
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Cambiar'
    });

    if (nuevaPassword) {
      try {
        await fetch(`https://backend-inventario-t3yr.onrender.com/auth/usuarios/${usuario.id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nuevaPassword, empresa: user.empresa }),
        });
        Swal.fire('Contraseña actualizada', 'La nueva contraseña fue guardada', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo cambiar la contraseña', 'error');
      }
    }
  };

  const usuariosFiltrados = empresaSeleccionada
    ? usuarios.filter(u => u.empresa === empresaSeleccionada)
    : [];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* Encabezado */}
      <div className="w-full flex items-center justify-between bg-white shadow p-4">
        <div className="flex items-center space-x-2 font-semibold text-gray-800">
          <FaUserCircle className="text-2xl" />
          <span>{user?.nombre || ''}</span>
        </div>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Banner */}
      <div className="w-full bg-blue-600 py-4 text-center text-white text-2xl font-semibold shadow">
        Panel de Administración
      </div>

      {/* Contenido */}
      <div className="w-full max-w-6xl p-6 mt-4">
        <div className="mb-4 text-center">
          <label className="mr-2 font-medium">Selecciona una empresa:</label>
          <select
            className="border rounded px-3 py-1"
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
          <table className="w-full border text-sm bg-white shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Nombre</th>
                <th className="p-2 border">Correo</th>
                <th className="p-2 border">Empresa</th>
                <th className="p-2 border">Teléfono</th>
                <th className="p-2 border">Rol</th>
                <th className="p-2 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map(usuario => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{usuario.nombre} {usuario.apellidos}</td>
                  <td className="p-2 border">{usuario.correo}</td>
                  <td className="p-2 border">{usuario.empresa}</td>
                  <td className="p-2 border">{usuario.telefono}</td>
                  <td className="p-2 border">{usuario.rol}</td>
                  <td className="p-2 border space-x-1">
                    <button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                      onClick={() => handleEditar(usuario)}
                    >
                      Editar
                    </button>
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                      onClick={() => handleCambiarContrasena(usuario)}
                    >
                      Contraseña
                    </button>
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                      onClick={() => handleEliminar(usuario.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : empresaSeleccionada ? (
          <p className="text-gray-600 text-center mt-4">No hay usuarios registrados en esta empresa.</p>
        ) : (
          <p className="text-gray-600 text-center mt-4">Selecciona una empresa para ver los usuarios.</p>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
