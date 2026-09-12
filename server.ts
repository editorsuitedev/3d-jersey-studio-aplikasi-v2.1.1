import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/database/db';
import { authRouter } from './server/routes/authRoutes';
import { accountRouter } from './server/routes/accountRoutes';
import { subscriptionRouter } from './server/routes/subscriptionRoutes';
import { exportRouter } from './server/routes/exportRoutes';
import { modelsRouter } from './server/routes/modelsRoutes';
import { usageRouter } from './server/routes/usageRoutes';

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

  // Initialize Core Tables database
  await initDatabase();

  // API health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: '3D Jersey Studio API',
      database: 'Core tables active (users, subscriptions, payments, usage, export_history, models, model_assets, admins)',
      business_model: 'Freemium SaaS (FREE: 1 model, no export; PRO: Rp249.000/bln, all models, full export)',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Core API endpoints
  app.use('/api/auth', authRouter);
  app.use('/api/account', accountRouter);
  app.use('/api/subscriptions', subscriptionRouter);
  app.use('/api/export', exportRouter);
  app.use('/api/models', modelsRouter);
  app.use('/api/usage', usageRouter);

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
