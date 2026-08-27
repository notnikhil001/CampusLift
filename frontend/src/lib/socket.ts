import { io, Socket } from 'socket.io-client';

const rawSocketUrl =
  import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = rawSocketUrl.replace(/\/+$/, '').replace(/\/api$/, '');

let socket: Socket | null = null;

export function getSocket(): Socket {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
      auth: token ? { token } : undefined,
    });
  } else if (token) {
    socket.auth = { token };
  }

  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}
