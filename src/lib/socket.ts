import { io, Socket } from 'socket.io-client';

/**
 * URL del servidor Socket.IO. Con la API same-origin (NEXT_PUBLIC_API_URL=/api/v1)
 * queda vacía: el cliente se conecta al mismo hostname del tenant y Nginx
 * envía /socket.io/ al backend.
 */
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL
  ?? process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '')
  ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const options = {
      autoConnect:    false,
      reconnection:   true,
      reconnectionDelay: 1000,
      transports:     ['websocket'],
    };
    socket = SOCKET_URL ? io(SOCKET_URL, options) : io(options);
  }
  return socket;
}
