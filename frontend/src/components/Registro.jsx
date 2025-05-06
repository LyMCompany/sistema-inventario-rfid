import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const API_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL
  : 'https://backend-inventario-t3yr.onrender.com';

function Registro() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [formData, setFormData] = useState({ nombre: '', apellidos: '', correo: '', empresa: '', telefono: '' });
  const [llaveIngresada, setLlaveIngresada] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [empresaActual, setEmpresaActual] = useState('');
  const [intentos, setIntentos] = useState(0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePaso1 = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setEmpresaActual(data.empresa);
        setPaso(2);
        setMensaje('');
      } else {
        setMensaje(data.mensaje || 'Error en el registro');
      }
    } catch {
      setMensaje('Error de conexión con el servidor');
    }
  };

  const handlePaso2 = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/validar-llave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa: empresaActual, clave: llaveIngresada })

      });
      const data = await res.json();
      if (res.ok && data.usuario) {
        setPaso(3);
        setMensaje('');
      } else {
        const nuevosIntentos = intentos + 1;
        setIntentos(nuevosIntentos);
        setMensaje(data.mensaje || 'Llave incorrecta');
        if (nuevosIntentos >= 3) {
          setMensaje('Máximo de intentos superado. Eliminando registro...');
          await fetch(`${API_URL}/auth/eliminar-empresa/${empresaActual}`, { method: 'DELETE' });
          setTimeout(() => navigate('/'), 2000);
        }
      }
    } catch {
      setMensaje('Error validando la llave');
    }
  };

  const handlePaso3 = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/registrar-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa: empresaActual, contrasena: password })

      });
      const data = await res.json();
      if (res.ok) {
        setMensaje('Usuario registrado con éxito. Redirigiendo al login...');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setMensaje(data.mensaje || 'Error al guardar contraseña');
      }
    } catch {
      setMensaje('Error al registrar contraseña');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <form className="login-form" onSubmit={
          paso === 1 ? handlePaso1 :
          paso === 2 ? handlePaso2 :
          handlePaso3
        }>
          {paso === 1 && (
            <>
              <h2>Registro de Usuario</h2>
              {['nombre', 'apellidos', 'correo', 'empresa', 'telefono'].map(field => (
                <input key={field} name={field} className="input-field" placeholder={field.charAt(0).toUpperCase() + field.slice(1)} required value={formData[field]} onChange={handleChange} />
              ))}
              <button type="submit" className="submit-button">Continuar</button>
            </>
          )}
          {paso === 2 && (
            <>
              <h2>Validación de Llave</h2>
              <p>Por favor, ingrese la llave entregada físicamente</p>
              <input className="input-field" placeholder="Ingrese la llave" required value={llaveIngresada} onChange={(e) => setLlaveIngresada(e.target.value)} />
              <button type="submit" className="submit-button">Validar</button>
            </>
          )}
          {paso === 3 && (
            <>
              <h2>Crear Contraseña</h2>
              <input type="password" className="input-field" placeholder="Ingrese su contraseña" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="submit" className="submit-button">Finalizar Registro</button>
            </>
          )}
          {mensaje && <p className={`message ${mensaje.includes('éxito') ? 'success' : 'error'}`}>{mensaje}</p>}
        </form>
      </div>
    </div>
  );
}

export default Registro;
