import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Dynamically load backend express app and socket service
  let backendApp: any;
  let socketService: any;

  try {
    // In Node CommonJS or tsx with createRequire
    const { createRequire } = await import('module');
    const req = createRequire(import.meta.url);
    backendApp = req('./e-kavach-backend/src/app.js');
    socketService = req('./e-kavach-backend/src/services/socket.service.js');
  } catch (_e) {
    // Fallback for direct CJS execution
    // @ts-ignore
    backendApp = require('./e-kavach-backend/src/app.js');
    // @ts-ignore
    socketService = require('./e-kavach-backend/src/services/socket.service.js');
  }

  // Mount backend API routes, Prometheus /metrics, and static uploads first
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.url.startsWith('/api') ||
      req.url.startsWith('/uploads') ||
      req.url === '/metrics' ||
      req.url.startsWith('/metrics')
    ) {
      return backendApp(req, res, next);
    }
    next();
  });

  // Create shared HTTP server for Express and Socket.IO
  const server = http.createServer(app);

  // Initialize Socket.io telemetry service on the shared server
  try {
    socketService.init(server);
    console.log('✅ Real-time telemetry WebSocket service attached to HTTP server');
  } catch (err: any) {
    console.warn('⚠️ Socket service initialization warning:', err.message);
  }

  // Frontend integration via Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        allowedHosts: true,
        hmr: {
          server,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('✅ Vite middleware mounted serving root E-Kavach frontend');
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('✅ Production static server mounted serving dist');
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 E-KAVACH integrated fullstack server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
