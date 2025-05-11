import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { useInventario } from '../context/InventarioContext';
import { useUser } from '../context/UserContext';
import { getSocket } from '../utils/websocket';


import '../styles/Inventario.css';

function Inventario() {
  const { logout } = useUser();
  const navigate = useNavigate();
  const { setInventarioBase } = useInventario();
  const { user } = useUser();
  const empresa = user?.empresa || 'Empresa no definida';

  const [data, setData] = useState([]);
  const inventarioWebSocketRecibido = useRef(false);


  useEffect(() => {
    const cargarInventario = async () => {
      // Esperar hasta 2 segundos si aún no hay inventario por WebSocket
      let espera = 0;
      while (!inventarioWebSocketRecibido.current && espera < 2000) {
        await new Promise(resolve => setTimeout(resolve, 100));
        espera += 100;
      }
  
      if (inventarioWebSocketRecibido.current) {
        console.log('⚠️ Ya se recibió inventario por WebSocket, se omite carga desde backend');
        return;
      }
  
      try {
        const res = await fetch(`https://backend-inventario-t3yr.onrender.com/inventarios/ultimo?usuario=${user.correo}&empresa=${user.empresa}`);
        const json = await res.json();
        if (json && Array.isArray(json.inventario)) {
          const transformado = json.inventario.map(item => ({
            Nombre: item.nombre,
            Codigo: item.codigo,
            SKU: item.sku,
            Marca: item.marca,
            RFID: String(item.rfid),
            Ubicacion: item.ubicacion
          }));
          setData(transformado);
          setInventarioBase(transformado);
          localStorage.setItem(`inventarioBase_${empresa}`, JSON.stringify(transformado));
          console.log('✅ Inventario cargado desde backend');
        }
      } catch (error) {
        console.error('Error al cargar inventario desde backend:', error);
        const local = localStorage.getItem(`inventarioBase_${empresa}`);
        if (local) {
          const json = JSON.parse(local).map(item => ({
            ...item,
            RFID: String(item.RFID)
          }));
          setData(json);
          setInventarioBase(json);
          console.log('📦 Inventario cargado desde localStorage como respaldo');
        }
      }
    };
  
    if (user?.empresa && user?.correo) {
      cargarInventario();
    }
  }, [user, empresa, setInventarioBase]);
  
  
  useEffect(() => {
    const socket = getSocket();

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.tipo === 'inventario' && Array.isArray(msg.inventario)) {
          const transformado = msg.inventario.map(item => ({
            Nombre: item.nombre,
            Codigo: item.codigo,
            SKU: item.sku,
            Marca: item.marca,
            RFID: String(item.rfid),
            Ubicacion: item.ubicacion
          }));
        
          setData(transformado);
          setInventarioBase(transformado);
          localStorage.setItem(`inventarioBase_${empresa}`, JSON.stringify(transformado));
          inventarioWebSocketRecibido.current = true; // 🔁 evitar que se reemplace por localStorage luego
          console.log('📥 Inventario recibido desde WebSocket:', transformado);
        }
        
      } catch (err) {
        console.error('❌ Error al procesar mensaje WebSocket:', err);
      }
    };
  }, []);

  
  const enviarInventarioAlBackend = async (inventario) => {
    try {
      const response = await fetch('https://backend-inventario-t3yr.onrender.com/inventarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: user.correo,
          empresa: user.empresa,
          inventario: inventario.map(item => ({
            nombre: item.Nombre || "-",
            codigo: item.Codigo || "-",
            sku: item.SKU || "-",
            marca: item.Marca || "-",
            rfid: String(item.RFID),
            ubicacion: item.Ubicacion || "-"
          }))
        })
      });
  
      if (!response.ok) throw new Error('Error al subir inventario');
      console.log('✅ Inventario enviado al backend');
    } catch (error) {
      console.error('❌ Error al enviar inventario:', error);
    }
  };
  
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
    localStorage.setItem(`inventarioBase_${empresa}`, JSON.stringify(ejemplo));
    
    const socket = getSocket();
    socket.onopen = () => {
      const payload = {
        tipo: 'inventario',
        usuario: user.correo,
        empresa: user.empresa,
        inventario: ejemplo.map(item => ({
          nombre: item.Nombre || "-",
          codigo: item.Codigo || "-",
          sku: item.SKU || "-",
          marca: item.Marca || "-",
          rfid: String(item.RFID),
          ubicacion: item.Ubicacion || "-"
        }))
      };
      // Enviar el payload al WebSocket      
      socket.send(JSON.stringify(payload));
      console.log("📤 Enviado por WebSocket:", JSON.stringify(payload, null, 2));
    };
    
    // Enviar inventario al backend
    enviarInventarioAlBackend(ejemplo);

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

        // Convertir la hoja a JSON
        const jsonData = XLSX.utils.sheet_to_json(ws, { raw: false });

        // Validar que el archivo tenga datos
        if (!jsonData || jsonData.length === 0) {
          Swal.fire('Error', 'El archivo está vacío o no tiene datos válidos', 'error');
          return;
        }

         
         const dataConvertida = jsonData.map(item => ({
          ...item,
          RFID: String(item.RFID)
        }));
          
        setData(dataConvertida);
        setInventarioBase(dataConvertida);
        localStorage.setItem(`inventarioBase_${empresa}`, JSON.stringify(dataConvertida));

         // WebSocket: enviar inventario en tiempo real
         const socket = getSocket();
         socket.onopen = () => {
           const payload = {
             tipo: 'inventario',
             usuario: user.correo,
             empresa: user.empresa,
             inventario: dataConvertida.map(item => ({
               nombre: item.Nombre || "-",
               codigo: item.Codigo || "-",
               sku: item.SKU || "-",
               marca: item.Marca || "-",
               rfid: String(item.RFID),
               ubicacion: item.Ubicacion || "-"
             }))
           };
           // Enviar el payload al WebSocket  
           socket.send(JSON.stringify(payload));
           console.log("📤 Enviado por WebSocket:", JSON.stringify(payload, null, 2));
         };
  
        enviarInventarioAlBackend(dataConvertida);
  
        Swal.fire({
          icon: 'success',
          title: `Archivo cargado exitosamente (${dataConvertida.length} filas procesadas)`,
          showConfirmButton: false,
          timer: 1500
        });
  
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
        localStorage.removeItem(`inventarioBase_${empresa}`);
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
        logout(); // ✅ Llamada correcta
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
          <span className="username">{empresa}</span>

          <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Cargar Inventario</h2>
      <div className="inventario-buttons">
        
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
                  <td className="celda-rfid">
  <button
    onClick={() => copiarAlPortapapeles(String(fila.RFID))}
    style={{
      background: 'none',
      border: 'none',
      padding: 0,
      color: 'blue',
      textDecoration: 'underline',
      cursor: 'pointer',
      wordBreak: 'break-word',
      whiteSpace: 'normal'
    }}
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