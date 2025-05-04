const bcrypt = require('bcrypt');

const contraseñaPlano = 'Servidor2021*';

bcrypt.hash(contraseñaPlano, 10).then(hash => {
  console.log('Contraseña encriptada:\n', hash);
}).catch(err => {
  console.error('Error al encriptar:', err);
});
