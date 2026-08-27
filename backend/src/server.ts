import http from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { env } from './config/env';
import { initializeSocketIO } from './sockets/socketManager';

const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:4173',
];

if (env.FRONTEND_URL) {
  const customOrigins = env.FRONTEND_URL.split(',').map((o) => o.trim().replace(/\/+$/, ''));
  allowedOrigins.push(...customOrigins);
}

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

initializeSocketIO(io);

server.listen(env.PORT, () => {
  console.log(`\n🚀 CampusLift Backend running on port ${env.PORT}`);
  console.log(`🌐 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Allowed Frontend Origin: ${env.FRONTEND_URL}\n`);
});
