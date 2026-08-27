import http from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { env } from './config/env';
import { initializeSocketIO } from './sockets/socketManager';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  },
});

initializeSocketIO(io);

server.listen(env.PORT, () => {
  console.log(`\n🚀 CampusLift Backend running on port ${env.PORT}`);
  console.log(`🌐 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Allowed Frontend Origin: ${env.FRONTEND_URL}\n`);
});
