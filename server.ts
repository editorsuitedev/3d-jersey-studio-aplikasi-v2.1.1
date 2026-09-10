import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/database/db';
import { authRouter } from './server/routes/authRoutes';
import { accountRouter } from './server/routes/accountRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

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
