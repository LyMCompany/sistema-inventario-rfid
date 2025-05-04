import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { useUser } from '../context/UserContext';

// 🔒 Usa la URL actual de ngrok directamente:
const API_URL = process.env.REACT_APP_API_URL;
console.log("URL usada para llamadas:", API_URL);


function Login() {
  const { setUsername } = useUser();
  const [usernameLocal, setUsernameLocal] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usernameLocal || !password) {
      setMessage('Por favor, completa todos los campos');
      return;
    }

    try {
      console.log("Enviando a:", `${API_URL}/auth/login`);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',},
        credentials: 'include',
        body: JSON.stringify({ empresa: usernameLocal, password }),
      });

      const data = await response.json();

      if (response.ok && data.mensaje === 'Login exitoso') {

        setUsername(usernameLocal);
        localStorage.setItem('username', usernameLocal);
        navigate('/dashboard');
      } else {
        setMessage(data.message || 'Error de inicio de sesión');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('No se pudo conectar con el servidor. Por favor, intenta más tarde.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <form onSubmit={handleSubmit} className="login-form">
          <h2>SevenShoes - Iniciar sesión</h2>
          <input type="text" className="input-field" placeholder="Nombre de la empresa" value={usernameLocal} onChange={(e) => setUsernameLocal(e.target.value)} required />
          <input type="password" className="input-field" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="submit-button">Iniciar sesión</button>
          {message && <p className={`message ${message.includes('exitoso') ? 'success' : 'error'}`}>{message}</p>}
        </form>
        <p className="register-link">¿No tienes cuenta?
          <span onClick={() => navigate('/registro')}>Regístrate aquí</span>
        </p>
      </div>
    </div>
  );
}

export default Login;
