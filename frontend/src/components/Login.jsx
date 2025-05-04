import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

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
        navigate(usuario.rol === 'admin' ? '/admin' : '/dashboard');
      } else {
        Swal.fire('Error', data.mensaje, 'error');
      }

    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Swal.fire('Error', 'No se pudo iniciar sesión', 'error');
    }
  };

  const handleRegistro = async () => {
    const { value: formValues, isConfirmed } = await Swal.fire({
      title: 'Registro de Usuario',
      html:
        '<input id="nombre" class="swal2-input" placeholder="Nombre">' +
        '<input id="apellidos" class="swal2-input" placeholder="Apellidos">' +
        '<input id="correo" class="swal2-input" placeholder="Correo">' +
        '<input id="empresa" class="swal2-input" placeholder="Empresa">' +
        '<input id="telefono" class="swal2-input" placeholder="Teléfono">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enviar datos',
      preConfirm: () => {
        const nombre = document.getElementById('nombre').value;
        const apellidos = document.getElementById('apellidos').value;
        const correo = document.getElementById('correo').value;
        const empresa = document.getElementById('empresa').value;
        const telefono = document.getElementById('telefono').value;

        if (!nombre || !apellidos || !correo || !empresa || !telefono) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }

        return { nombre, apellidos, correo, empresa, telefono };
      }
    });

    if (!isConfirmed || !formValues) return;

    const clave = `${crypto.randomUUID().slice(0, 4)}-${crypto.randomUUID().slice(0, 4)}-${crypto.randomUUID().slice(0, 4)}`;

    try {
      const response = await fetch('https://backend-inventario-t3yr.onrender.com/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formValues, clave })
      });

      const data = await response.json();

      if (response.ok) {
        let intentos = 0;
        let validado = false;

        while (intentos < 3 && !validado) {
          const { value: llaveIngresada } = await Swal.fire({
            title: `Validación para empresa ${formValues.empresa}`,
            input: 'text',
            inputLabel: 'Ingresa la llave enviada al correo',
            inputPlaceholder: 'xxxx-xxxx-xxxx',
            showCancelButton: true,
            inputValidator: (value) => {
              if (!value) return 'Debes ingresar la llave';
            }
          });

          if (llaveIngresada === clave) {
            validado = true;
            await Swal.fire('Registro exitoso', 'Usuario validado y registrado correctamente.', 'success');
          } else {
            intentos++;
            if (intentos >= 3) {
              await fetch(`https://backend-inventario-t3yr.onrender.com/auth/eliminar-empresa/${formValues.empresa}`, {
                method: 'DELETE'
              });
              await Swal.fire('Error', 'Máximo de intentos superado. Registro cancelado.', 'error');
              return;
            } else {
              await Swal.fire('Error', 'Llave incorrecta', 'warning');
            }
          }
        }

        if (!validado) {
          await fetch(`https://backend-inventario-t3yr.onrender.com/auth/eliminar-empresa/${formValues.empresa}`, {
            method: 'DELETE'
          });
        }

      } else {
        Swal.fire('Error', data.mensaje || 'No se pudo registrar el usuario', 'error');
      }

    } catch (error) {
      console.error('Error durante el registro:', error);
      Swal.fire('Error', 'Error de red o del servidor', 'error');
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Iniciar Sesión</h2>
      <form className="login-form" onSubmit={handleLogin}>
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
        <div>
          <button type="submit">Ingresar</button>
          <button type="button" onClick={handleRegistro}>Registrarse</button>
        </div>
      </form>
    </div>
  );
}

export default Login;
