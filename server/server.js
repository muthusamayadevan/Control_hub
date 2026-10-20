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

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email', 'X-User-Email'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
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
  res.status(200).json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'ControlHub Backend API',
  });
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
