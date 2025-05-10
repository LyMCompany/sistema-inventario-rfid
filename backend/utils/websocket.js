let socket = null;

export const getSocket = () => {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    socket = new WebSocket('wss://rfid-websocket-server-production.up.railway.app');
  }
  return socket;
};
