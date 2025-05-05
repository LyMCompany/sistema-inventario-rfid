import React, { createContext, useContext, useState } from 'react';

// 1. Crear el contexto
const UserContext = createContext();

// 2. Crear el proveedor con persistencia en localStorage
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('usuario');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetUser = (userData) => {
    setUser(userData);
    localStorage.setItem('usuario', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('usuario');
  };

  return (
    <UserContext.Provider value={{ user, setUser: handleSetUser, logout: handleLogout }}>
      {children}
    </UserContext.Provider>
  );
};

// 3. Hook para usar el contexto
export const useUser = () => useContext(UserContext);
