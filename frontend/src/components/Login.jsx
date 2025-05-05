import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/Login.css';
import { useUser } from '../context/UserContext';

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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa, contrasena })
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.usuario); // Guarda todo el objeto del usuario
        navigate(data.rol === 'admin' ? '/admin' : '/dashboard');
      } else {
        Swal.fire('Error', data.mensaje, 'error');
      }
    } catch (error) {
      console.error('Error en login:', error);
      Swal.fire('Error', 'Error en el servidor', 'error');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Inicio de Sesión</h2>
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
          <button type="submit">Ingresar</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
