import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/database/db';
import { seedInitialUsers } from './server/services/userService';
import { authRouter } from './server/routes/authRoutes';
import { accountRouter } from './server/routes/accountRoutes';
import { paymentRouter } from './server/routes/paymentRoutes';

async function startServer() {
  const app = express();
  // In development, port 3000 is required by the container reverse proxy. On external hosting, support custom PORT.
  const PORT = process.env.NODE_ENV === 'production' && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // In production, warn if environment variables are not yet configured
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.trim().length === 0) {
      console.warn('[Security Warning] AUTH_SECRET is not set in production. Using temporary fallback secret.');
    }
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim().length === 0) {
      console.warn('[Database Warning] DATABASE_URL is not set. In-memory data store will be used.');
    }
  }

  // Basic security and parsing middleware
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Initialize PostgreSQL database connection & table
  await initDatabase();
  // Seed demo/admin users so credentials are ready
  await seedInitialUsers();

  // API health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: '3D Jersey Studio API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API endpoints
  app.use('/api/auth', authRouter);
  app.use('/api/account', accountRouter);
  app.use('/api/payment', paymentRouter);

  // Return 404 JSON for all unhandled /api/* requests so Vite/Express never return HTML
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Endpoint API tidak ditemukan' });
  });

  // Global Express error handler guaranteeing all server errors return JSON, never HTML
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[API Server Error]:', err?.message || err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        error: err.message || 'Terjadi kesalahan pada server. Silakan coba lagi.',
      });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] 3D Jersey Studio Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal error on server startup:', err);
});
