import React, { createContext, useContext, useState, useEffect } from 'react';

const InventarioContext = createContext();

export const InventarioProvider = ({ children }) => {
  const [inventarioBase, setInventarioBase] = useState(() => {
    const saved = localStorage.getItem('inventarioBase');
    return saved ? JSON.parse(saved) : [];
  });

  // Sincronizar contexto con localStorage al actualizarse
  useEffect(() => {
    localStorage.setItem('inventarioBase', JSON.stringify(inventarioBase));
  }, [inventarioBase]);

  return (
    <InventarioContext.Provider value={{ inventarioBase, setInventarioBase }}>
      {children}
    </InventarioContext.Provider>
  );
};

export const useInventario = () => useContext(InventarioContext);
