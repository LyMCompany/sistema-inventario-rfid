import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { InventarioProvider } from './context/InventarioContext';
import { UserProvider } from './context/UserContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserProvider>
    <InventarioProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </InventarioProvider>
  </UserProvider>
);
