import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import applianceRoutes from './routes/applianceRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { startTelemetrySimulator } from './services/telemetrySimulator.js';

// Load environment variables with fallback path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Connect to MongoDB and start telemetry simulator service
connectDB().then(() => {
  startTelemetrySimulator();
});

const app = express();
const PORT = process.env.PORT || 5000;

// CORS & Preflight Middleware Configuration
const allowedOrigins = [
  'https://control-hub-ten.vercel.app',
  'https://control-hub-inky.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Email', 'x-user-email'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200,
};

// Configure CORS at the very top of the Express middleware stack
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Ensure OPTIONS preflight requests return HTTP 204 or HTTP 200 without blocking
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

// Request logging middleware (dev)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Root & Health check routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ControlHub API - Smart Home Automation System',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      appliances: '/api/appliances',
      users: '/api/users',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', online: true });
});

// API Routes
app.use('/api/appliances', applianceRoutes);
app.use('/api/users', userRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 ControlHub Server running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚡ API Health: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});

export { app };
export default app;

