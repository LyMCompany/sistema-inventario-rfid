import React from 'react';
import Swal from 'sweetalert2';

const RegistroUsuario = () => {
  const handleRegistro = async () => {
    const { value: datos } = await Swal.fire({
      title: 'Registro de Usuario',
      html:
        '<input id="swal-nombre" class="swal2-input" placeholder="Nombre">' +
        '<input id="swal-apellidos" class="swal2-input" placeholder="Apellidos">' +
        '<input id="swal-correo" type="email" class="swal2-input" placeholder="Correo">' +
        '<input id="swal-empresa" class="swal2-input" placeholder="Nombre de la Empresa">' +
        '<input id="swal-telefono" class="swal2-input" placeholder="Teléfono">',
      focusConfirm: false,
      preConfirm: () => {
        return {
          nombre: document.getElementById('swal-nombre').value,
          apellidos: document.getElementById('swal-apellidos').value,
          correo: document.getElementById('swal-correo').value,
          empresa: document.getElementById('swal-empresa').value,
          telefono: document.getElementById('swal-telefono').value,
        };
      },
      showCancelButton: true,
      confirmButtonText: 'Enviar datos'
    });

    if (datos) {
      try {
        const res = await fetch('http://localhost:5000/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });

        const respuesta = await res.json();

        if (!res.ok) {
          throw new Error(respuesta.mensaje || 'Error al registrar');
        }

        Swal.fire('Llave generada', `Llave: ${respuesta.llave}`, 'info');
        validarLlave(respuesta.empresa);

      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  const validarLlave = async (empresa) => {
    for (let intento = 1; intento <= 3; intento++) {
      const { value: llaveIngresada } = await Swal.fire({
        title: `Validar llave para ${empresa}`,
        input: 'text',
        inputPlaceholder: 'Ingrese la llave enviada',
        showCancelButton: true,
        confirmButtonText: 'Validar'
      });

      if (!llaveIngresada) return;

      const res = await fetch('http://localhost:5000/validar-llave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa, llaveIngresada })
      });

      const data = await res.json();

      if (res.ok && data.validado) {
        Swal.fire('Validación exitosa', 'Llave correcta', 'success');
        return pedirContraseña(empresa);
      } else if (res.status === 401) {
        Swal.fire('Llave incorrecta', `Intento ${data.intentos} de 3`, 'error');
      } else {
        Swal.fire('Error', data.mensaje, 'error');
        break;
      }
    }

    Swal.fire('Cancelado', 'Se excedieron los intentos', 'error');
  };

  const pedirContraseña = async (empresa) => {
    const { value: password } = await Swal.fire({
      title: 'Registre su contraseña',
      input: 'password',
      inputPlaceholder: 'Ingrese una contraseña',
      confirmButtonText: 'Aceptar',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off'
      }
    });

    if (!password) return;

    const res = await fetch('http://localhost:5000/registrar-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa, password })
    });

    const data = await res.json();

    if (res.ok) {
      Swal.fire('Usuario registrado', data.mensaje, 'success');
    } else {
      Swal.fire('Error', data.mensaje, 'error');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <button onClick={handleRegistro}>Registrar Usuario</button>
    </div>
  );
};

export default RegistroUsuario;
