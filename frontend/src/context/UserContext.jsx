import React, { createContext, useContext, useState } from 'react';

// 1. Crear el contexto
const UserContext = createContext();

// 2. Crear el proveedor con persistencia en localStorage
export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('usuario') || '';
  });

  const handleSetUsername = (name) => {
    setUsername(name);
    localStorage.setItem('usuario', name); // Guardar al establecer
  };

  const handleLogout = () => {
    setUsername('');
    localStorage.removeItem('usuario');
  };

  return (
    <UserContext.Provider value={{ username, setUsername: handleSetUsername, logout: handleLogout }}>
      {children}
    </UserContext.Provider>
  );
};

// 3. Hook para usar el contexto
export const useUser = () => useContext(UserContext);
