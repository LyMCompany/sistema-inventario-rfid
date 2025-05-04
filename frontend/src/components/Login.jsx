import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { handleRegistro } from './RegistroUsuario';
import '../styles/Login.css';
import { useUser } from '../context/UserContext';

function Login() {
  const { setUsername } = useUser();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!empresa || !password) {
      Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
      return;
    }

    try {
      const response = await fetch('https://backend-inventario-t3yr.onrender.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa, password })
      });

      const data = await response.json();

      if (response.ok && data.mensaje === 'Login exitoso') {
        const usuario = data.usuario;
        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('username', usuario.empresa);
        setUsername(usuario.empresa);

        if (usuario.rol === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        Swal.fire('Error', data.mensaje, 'error');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Swal.fire('Error', 'No se pudo iniciar sesión', 'error');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Ingresar</button>
        </form>
        <button
          type="button"
          onClick={handleRegistro}
          style={{
            marginTop: '10px',
            background: '#007bff',
            color: '#fff',
            border: 'none',
            padding: '10px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Registrarse
        </button>
      </div>
    </div>
  );
}

export default Login;
