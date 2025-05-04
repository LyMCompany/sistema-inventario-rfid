import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { useInventario } from '../context/InventarioContext';
import { useUser } from '../context/UserContext';
import '../styles/Inventario.css';

function Inventario() {
  const navigate = useNavigate();
  const { setInventarioBase } = useInventario();
  const { username, setUsername } = useUser();

  const [data, setData] = useState(() => {
    const guardado = localStorage.getItem('inventarioBase');
    return guardado
      ? JSON.parse(guardado).map(item => ({
          ...item,
          RFID: String(item.RFID), // Convertir RFID a cadena
        }))
      : [];
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('Datos cargados en Inventario.jsx:', data); // Depuración
    setInventarioBase(data);
  }, [data, setInventarioBase]);

  const handleWebService = () => {
    const ejemplo = [
      { Nombre: 'CAMISETA XL', Codigo: '500004042', SKU: '2332', Marca: 'HG', RFID: 'A0123456B89C0123D456E012F6789ABC', Ubicacion: 'MATRIZ RIOBAMBA' },
      { Nombre: 'ZAPATOS', Codigo: '500004043', SKU: '4554', Marca: 'HG', RFID: '8585158880000052124000121521258934', Ubicacion: 'MATRIZ RIOBAMBA' },
    ].map(item => ({
      ...item,
      RFID: String(item.RFID), // Convertir RFID a cadena
    }));

    setData(ejemplo);
    localStorage.setItem('inventarioBase', JSON.stringify(ejemplo));
    Swal.fire({ icon: 'success', title: 'Información cargada', showConfirmButton: false, timer: 1500 });
  };

  const handleArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return Swal.fire('Error', 'No se seleccionó ningún archivo', 'error');

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      Swal.fire('Error', 'El archivo debe ser un Excel (.xlsx o .xls)', 'error');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws, { raw: false });

        if (!jsonData || jsonData.length === 0) {
          Swal.fire('Error', 'El archivo está vacío o no tiene datos válidos', 'error');
          return;
        }

        const dataConvertida = jsonData.map(item => ({
          ...item,
          RFID: String(item.RFID), // Convertir RFID a cadena
        }));

        setData(dataConvertida);
        setInventarioBase(dataConvertida); // Actualizar el contexto compartido
        localStorage.setItem('inventarioBase', JSON.stringify(dataConvertida));
        Swal.fire({ icon: 'success', title: `Archivo cargado exitosamente (${dataConvertida.length} filas procesadas)`, showConfirmButton: false, timer: 1500 });
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
        Swal.fire('Error', 'Hubo un problema al procesar el archivo', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleLimpiarInventario = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas borrar la lista de Inventario Cargado?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        setData([]);
        localStorage.removeItem('inventarioBase');
        setInventarioBase([]); // Limpiar el contexto compartido
        Swal.fire('Limpieza exitosa', 'Inventario cargado eliminado.', 'success');
      }
    });
  };

  const handleBack = () => navigate('/dashboard');

  const handleLogout = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Vas a cerrar sesión',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        setUsername('');
        navigate('/');
      }
    });
  };

  const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto).then(() => {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Copiado al portapapeles',
        showConfirmButton: false,
        timer: 1000
      });
    });
  };

  return (
    <div className="inventario-container">
      <div className="inventario-header">
        <div className="left-actions">
          <button className="btn-regresar" onClick={handleBack}>Regresar</button>
        </div>
        <div className="user-info">
          <span className="user-icon">👤</span>
          <span className="username">{username || 'Invitado'}</span>
          <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Cargar Inventario</h2>
      <div className="inventario-buttons">
        <button className="btn btn-primary uniform-button" onClick={handleWebService}>Cargar mediante WebService</button>
        <label className="custom-file-upload uniform-button">
          <input type="file" accept=".xlsx, .xls" onChange={handleArchivo} />
          Cargar Excel
        </label>
        <button className="btn btn-primary uniform-button" onClick={handleLimpiarInventario}>Limpiar Tabla</button>
      </div>

      {isLoading && <p>Cargando archivo...</p>}

      {data.length > 0 && (
        <div className="tabla-contenedor">
          <h3>Inventario Base</h3>
          <table className="tabla-inventario">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>SKU</th>
                <th>Marca</th>
                <th>RFID</th>
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {data.map((fila, index) => (
                <tr key={index}>
                  <td>{fila.Nombre}</td>
                  <td>{fila.Codigo}</td>
                  <td>{fila.SKU}</td>
                  <td>{fila.Marca}</td>
                  <td>
                  <button
  onClick={() => copiarAlPortapapeles(String(fila.RFID))}
  style={{ background: 'none', border: 'none', padding: 0, color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
>
  {String(fila.RFID)}
</button>
                  </td>
                  <td>{fila.Ubicacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>Total artículos cargados: <strong>{data.length}</strong></p>
        </div>
      )}
    </div>
  );
}

export default Inventario;