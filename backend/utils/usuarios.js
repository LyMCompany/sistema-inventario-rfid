const fs = require('fs');
const path = require('path');
const usuariosPath = path.join(__dirname, '../usuarios.json');

const leerUsuarios = () => {
  if (!fs.existsSync(usuariosPath)) return [];
  return JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
};

const guardarUsuarios = (usuarios) => {
  fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
};

module.exports = { leerUsuarios, guardarUsuarios };