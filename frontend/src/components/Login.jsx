import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { registrarUsuario } from '../utils/registroUtils'; // Extraer lógica de registro a un módulo reutilizable

const API_BASE_URL = 'https://backend-inventario-t3yr.onrender.com';

function Login() {
  const [empresa, setEmpresa] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!empresa || !password) {
      Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa, password })
      });

      const data = await response.json();

      if (response.ok && data.mensaje === 'Login exitoso') {
        const usuario = data.usuario;
        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('username', usuario.empresa);
        navigate(usuario.rol === 'admin' ? '/admin' : '/dashboard');
      } else {
        Swal.fire('Error', data.mensaje || 'Credenciales incorrectas', 'error');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Swal.fire('Error', 'No se pudo iniciar sesión. Verifica tu conexión.', 'error');
    }
  };

  const handleRegistro = async () => {
    try {
      const registroExitoso = await registrarUsuario(API_BASE_URL);
      if (registroExitoso) {
        Swal.fire('Éxito', 'Usuario registrado correctamente. Ahora puedes iniciar sesión.', 'success');
      }
    } catch (error) {
      console.error('Error durante el registro:', error);
      Swal.fire('Error', error.message || 'No se pudo completar el registro.', 'error');
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Iniciar Sesión</h2>
      <form className="login-form" onSubmit={handleLogin}>
        <label htmlFor="empresa">Empresa</label>
        <input
          id="empresa"
          type="text"
          placeholder="Empresa"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
        />
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div>
          <button type="submit">Ingresar</button>
          <button type="button" onClick={handleRegistro}>Registrarse</button>
        </div>
      </form>
    </div>
  );
}

export default Login;