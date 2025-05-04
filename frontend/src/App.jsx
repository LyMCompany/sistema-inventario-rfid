import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Inventario from './pages/Inventario';
import ControlInventario from './pages/ControlInventario';
import Reportes from './pages/Reportes';
import Registro from './components/Registro';

import { InventarioProvider } from './context/InventarioContext';
import { UserProvider } from './context/UserContext';

// Componente para proteger rutas privadas
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = !!localStorage.getItem('username');
  return isLoggedIn ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Rutas protegidas */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/inventario" element={
        <ProtectedRoute>
          <Inventario />
        </ProtectedRoute>
      } />
      <Route path="/control-inventario" element={
        <ProtectedRoute>
          <ControlInventario />
        </ProtectedRoute>
      } />
      <Route path="/reportes" element={
        <ProtectedRoute>
          <Reportes />
        </ProtectedRoute>
      } />

      {/* Ruta comodín */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
