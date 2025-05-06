import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../styles/Usuarios.css'; // (opcional, para estilizar si ya tienes algo)

const API_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL
  : 'https://backend-inventario-t3yr.onrender.com';


function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);

  const obtenerUsuarios = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/usuarios`);
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      Swal.fire('Error', 'No se pudieron obtener los usuarios.', 'error');
    }
  };

  const eliminarUsuario = async (id) => {
    const confirmacion = await Swal.fire({
      title: 'Eliminar usuario?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
  
    if (confirmacion.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/auth/usuarios/${id}`, {
          method: 'DELETE',
        });
  
        const result = await response.json();
  
        if (response.ok) {
          Swal.fire('Eliminado', result.mensaje, 'success');
          obtenerUsuarios(); // actualiza la tabla
        } else {
          throw new Error(result.mensaje);
        }
      } catch (error) {
        console.error('Error al eliminar:', error);
        Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
      }
    }
  };
  

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  return (
    <div className="usuarios-container">
      <h2>Usuarios registrados</h2>
      <table className="tabla-usuarios">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Apellidos</th>
            <th>Correo</th>
            <th>Empresa</th>
            <th>Teléfono</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.nombre}</td>
              <td>{u.apellidos}</td>
              <td>{u.correo}</td>
              <td>{u.empresa}</td>
              <td>{u.telefono}</td>
              <td>
                <button onClick={() => eliminarUsuario(u.id)} className="btn-eliminar">
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {usuarios.length === 0 && (
            <tr>
              <td colSpan="7">No hay usuarios registrados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Usuarios;
