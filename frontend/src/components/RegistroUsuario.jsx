import Swal from 'sweetalert2';

const RegistroUsuario = async () => {
  const { value: formValues } = await Swal.fire({
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

  if (formValues) {
    try {
      const response = await fetch('https://backend-inventario-t3yr.onrender.com/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });

      const data = await response.json();

      if (response.ok) {
        let intentos = 0;
        let validado = false;
        const clave = data.clave;

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
  }
};

export default RegistroUsuario;