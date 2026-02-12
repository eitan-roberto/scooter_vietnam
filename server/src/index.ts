import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { RaceRoom } from './rooms/RaceRoom.js';

const app = express();
const port = process.env.PORT || 2567;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Create HTTP server
const server = createServer(app);

// Create Colyseus server
const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
  }),
});

// Register room
 gameServer.define('race', RaceRoom)
  .enableRealtimeListing();

// Start server
gameServer.listen(port).then(() => {
  console.log(`🎮 Game server running on port ${port}`);
  console.log(`🌐 WebSocket endpoint: ws://localhost:${port}`);
}).catch(err => {
  console.error('Failed to start server:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  gameServer.gracefullyShutdown().then(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  gameServer.gracefullyShutdown().then(() => {
    process.exit(0);
  });
});
