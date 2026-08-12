import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import customerRoutes from './modules/customers/customers.routes.js';
import productRoutes from './modules/products/products.routes.js';
import challanRoutes from './modules/challans/challans.routes.js';
import invoiceRoutes from './modules/invoices/invoices.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import swaggerUi from 'swagger-ui-express';

// __dirname is natively available in CommonJS output

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed origin or local dev
    if (
      !process.env.CLIENT_URL ||
      process.env.CLIENT_URL === '*' ||
      origin === process.env.CLIENT_URL ||
      origin === process.env.CLIENT_URL.replace(/\/+$/, '') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('onrender.com') ||
      origin.includes('amplifyapp.com') ||
      origin.includes('vercel.app') ||
      origin.includes('netlify.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
  }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

import { swaggerDocument } from './config/swagger.js';

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount endpoints
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Mini ERP + CRM API Portal. View documentation at /api/docs',
  });
});

app.use(errorHandler);

export default app;
