import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import '../styles/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();

  // Validación robusta del usuario
  const rawUsuario = localStorage.getItem('usuario');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');


  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro que deseas salir?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('usuario');
        navigate('/');
      }
    });
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">
          V<span>7</span>
        </div>
        <div className="user-info">
          <FaUserCircle size={24} />
          <span>Empresa: {usuario.empresa || 'Invitado'}</span>
          <button className="logout-button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <h1>Sistema de Inventario RFID LyM Company</h1>

        <div className="dashboard-buttons">
          <button className="btn-dashboard" onClick={() => navigate('/inventario')}>
            Cargar Inventario
          </button>

          <button className="btn-dashboard" onClick={() => navigate('/control-inventario')}>
            Control de Inventario
          </button>

          <button className="btn-dashboard" onClick={() => navigate('/reportes')}>
            Reportes
          </button>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
