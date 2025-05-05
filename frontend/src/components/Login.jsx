import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/Login.css';
import { useUser } from '../context/UserContext';

const BACKEND_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL
  : 'https://backend-inventario-t3yr.onrender.com';


function Login() {
  const [empresa, setEmpresa] = useState('');
  const [contrasena, setContrasena] = useState('');
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!empresa || !contrasena) {
      Swal.fire('Campos requeridos', 'Debes ingresar todos los campos', 'warning');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa, contrasena })
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.usuario);
        navigate(data.rol === 'admin' ? '/admin' : '/dashboard');
      } else {
        Swal.fire('Error', data.mensaje, 'error');
      }
    } catch (error) {
      console.error('Error en login:', error);
      Swal.fire('Error', 'Error en el servidor', 'error');
    }
  };

  const handleRegistro = () => {
    navigate('/registro'); // O abre modal si es emergente
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Inicio de Sesión</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Nombre de la empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
          <div className="login-buttons">
            <button type="submit" className="login-button">Ingresar</button>
            <button type="button" className="register-button" onClick={handleRegistro}>Registrarse</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
