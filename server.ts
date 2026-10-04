import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db';
import { authRouter } from './server/routes/authRoutes';
import { batchesRouter } from './server/routes/batchesRoutes';
import { branchesRouter } from './server/routes/branchesRoutes';
import { invoicesRouter } from './server/routes/invoicesRoutes';
import { productsRouter } from './server/routes/productsRoutes';
import { reportsRouter } from './server/routes/reportsRoutes';
import { syncRouter } from './server/routes/syncRoutes';
import { usersRouter } from './server/routes/usersRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware body parsing (hỗ trợ upload ảnh đại diện và ảnh sản phẩm base64 lớn)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Khởi tạo và đồng bộ bảng cơ sở dữ liệu SQLite
  try {
    await initDatabase();
    console.log('✅ SQLite Database initialized and seeded successfully.');
  } catch (dbError) {
    console.error('❌ Failed to initialize SQLite database:', dbError);
  }

  // Đăng ký các tuyến API nghiệp vụ cho FreshMart RMS
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/branches', branchesRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/batches', batchesRouter);
  app.use('/api/invoices', invoicesRouter);
  app.use('/api/sync', syncRouter);
  app.use('/api/reports', reportsRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'FreshMart RMS',
      timestamp: new Date().toISOString(),
      database: 'SQLite',
    });
  });

  // Tích hợp Vite development middleware hoặc phục vụ static file
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('⚡ Vite middlewares mounted in dev mode.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('📦 Serving production build from dist/.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FreshMart RMS Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
