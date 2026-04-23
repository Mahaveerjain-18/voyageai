import dotenv from 'dotenv';
import path from 'path';

// Load .env BEFORE any service imports read process.env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

import { healthRouter } from './routes/health';
import { tripRouter } from './routes/trips';
import { checkoutRouter } from './routes/checkout';
import { walletRouter } from './routes/wallet';
import { auditRouter } from './routes/audit';
import { agentRouter } from './routes/agent';
import { chatRouter } from './routes/chat';
import { AuditLogger } from './services/auditLogger';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ─── Request logging ─────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────────
app.use('/', healthRouter);
app.use('/api/trips', tripRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/audit', auditRouter);
app.use('/api/agent', agentRouter);
app.use('/api/chat', chatRouter);

// ─── HTTP + WebSocket Server ─────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/audit' });

// Initialize the global audit logger with WebSocket
const auditLogger = AuditLogger.getInstance();
auditLogger.setWebSocketServer(wss);

wss.on('connection', (ws) => {
  console.log('[WS] Client connected to audit stream');

  ws.on('close', () => {
    console.log('[WS] Client disconnected from audit stream');
  });
});

// ─── Start ───────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║         🌍 VoyageAI Backend Server           ║
  ║         Port: ${PORT}                          ║
  ║         Health: http://localhost:${PORT}/health  ║
  ╚══════════════════════════════════════════════╝
  `);
});

export { app, server, wss };
