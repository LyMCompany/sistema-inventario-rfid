import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';

export const handleRegistro = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'Registro de Usuario',
    html:
      '<input id="nombre" class="swal2-input" placeholder="Nombre">' +
      '<input id="apellidos" class="swal2-input" placeholder="Apellidos">' +
      '<input id="correo" type="email" class="swal2-input" placeholder="Correo">' +
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

  if (formValues) {
    const llave = uuidv4().slice(0, 4) + '-' + uuidv4().slice(0, 4) + '-' + uuidv4().slice(0, 4);

    try {
      const response = await fetch('https://backend-inventario-t3yr.onrender.com/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formValues, clave: llave })
      });

      const data = await response.json();

      if (response.ok) {
        let intentos = 0;
        let validado = false;

        while (intentos < 3 && !validado) {
          const { value: claveIngresada } = await Swal.fire({
            title: `Validación para empresa ${formValues.empresa}`,
            input: 'text',
            inputLabel: 'Ingresa la llave enviada:',
            inputPlaceholder: 'xxxx-xxxx-xxxx',
            showCancelButton: true,
            inputValidator: (value) => {
              if (!value) return 'Debes ingresar una llave';
            }
          });

          if (claveIngresada === llave) {
            await Swal.fire('Registro exitoso', 'Usuario registrado correctamente.', 'success');
            validado = true;
          } else {
            intentos++;
            if (intentos >= 3) {
              Swal.fire('Error', 'Has superado el número de intentos', 'error');
            } else {
              Swal.fire('Error', 'Llave incorrecta', 'warning');
            }
          }
        }
      } else {
        Swal.fire('Error', data.mensaje || 'No se pudo registrar', 'error');
      }
    } catch (error) {
      console.error('Error durante el registro:', error);
      Swal.fire('Error', 'Error en la solicitud', 'error');
    }
  }
};
