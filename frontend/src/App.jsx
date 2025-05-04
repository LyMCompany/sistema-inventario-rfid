import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Inventario from './pages/Inventario';
import ControlInventario from './pages/ControlInventario';
import Reportes from './pages/Reportes';
import Registro from './components/Registro';
import AdminPanel from './components/AdminPanel'; // ⬅️ Asegúrate que esté importado

import { InventarioProvider } from './context/InventarioContext';
import { UserProvider } from './context/UserContext';

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = !!localStorage.getItem('username');
  return isLoggedIn ? children : <Navigate to="/" />;
};

const AdminRoute = ({ children }) => {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  return usuario?.rol === 'admin' ? children : <Navigate to="/" />;
};


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

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
      <Route path="/admin" element={
        <AdminRoute>
          <AdminPanel />
        </AdminRoute>
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
