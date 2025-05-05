import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/Login.css';
import { handleRegistro } from '../utils/registroUtils';

function Login() {
  const [empresa, setEmpresa] = useState('');
  const [contrasena, setContrasena] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!empresa || !contrasena) {
      Swal.fire('Error', 'Por favor completa todos los campos', 'warning');
      return;
    }

    try {
      const response = await fetch('https://backend-inventario-t3yr.onrender.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa, password: contrasena }) // <--- CORREGIDO
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('username', empresa);
        localStorage.setItem('rol', data.rol);
        navigate(data.rol === 'admin' ? '/admin' : '/dashboard');
      } else {
        Swal.fire('Error', data.mensaje || 'Credenciales incorrectas', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Iniciar Sesión</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
        </div>
        <div className="login-buttons">
          <button className="login-button" onClick={handleLogin}>Ingresar</button>
          <button className="register-button" onClick={handleRegistro}>Registrarse</button>
        </div>
      </div>
    </div>
  );
}

export default Login;
