import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';

function RegistroUsuario({ cerrar }) {
  const [form, setForm] = useState({ nombre: '', apellidos: '', correo: '', empresa: '', telefono: '' });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegistro = async () => {
    const { nombre, apellidos, correo, empresa, telefono } = form;

    if (!nombre || !apellidos || !correo || !empresa || !telefono) {
      Swal.fire('Faltan datos', 'Todos los campos son obligatorios', 'warning');
      return;
    }

    try {
      const response = await fetch('https://backend-inventario-t3yr.onrender.com/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        let validado = false;
        let intentos = 0;

        while (!validado && intentos < 3) {
          const { value: llaveIngresada } = await Swal.fire({
            title: `Validación para empresa ${data.empresa}`,
            input: 'text',
            inputLabel: 'Por favor, ingrese la llave enviada al correo',
            inputPlaceholder: 'xxxx-xxxx-xxxx',
            showCancelButton: true
          });

          if (!llaveIngresada) return;

          const validar = await fetch('https://backend-inventario-t3yr.onrender.com/auth/validar-llave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: data.empresa, llaveIngresada })
          });

          const res = await validar.json();

          if (validar.ok && res.validado) {
            validado = true;
            await Swal.fire('Validado', 'Su empresa ha sido registrada correctamente', 'success');
            cerrar();
          } else {
            intentos++;
            Swal.fire('Llave incorrecta', res.mensaje, 'error');
          }
        }

        if (!validado) {
          Swal.fire('Error', 'Máximo de intentos superado', 'error');
          cerrar();
        }
      } else {
        Swal.fire('Error', data.mensaje, 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Error durante el registro', 'error');
    }
  };

  return (
    <div className="registro-overlay">
      <div className="registro-modal">
        <h3>Registro de Usuario</h3>
        <input name="nombre" placeholder="Nombre" onChange={handleChange} />
        <input name="apellidos" placeholder="Apellidos" onChange={handleChange} />
        <input name="correo" placeholder="Correo" onChange={handleChange} />
        <input name="empresa" placeholder="Empresa" onChange={handleChange} />
        <input name="telefono" placeholder="Teléfono" onChange={handleChange} />
        <button onClick={handleRegistro}>Enviar datos</button>
        <button onClick={cerrar}>Cancelar</button>
      </div>
    </div>
  );
}

export default RegistroUsuario;
