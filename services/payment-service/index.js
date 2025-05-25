import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import paymentRoutes from "./routes/payment.routes.js";

// Load environment variables first
dotenv.config();

// Debug: Check if environment variables are loaded
console.log('Environment check:');
console.log('PORT:', process.env.PORT);
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Found' : 'Missing');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Found' : 'Missing');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Missing');

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
};

app.use(cors(corsOptions));

// Middleware for parsing requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (before other routes)
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    service: "Payment Service",
    timestamp: new Date().toISOString(),
    razorpay_configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use("/api/payments", paymentRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    error: "Internal server error",
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.originalUrl,
    method: req.method 
  });
});

const PORT = process.env.PORT || 3006;

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    console.log('Database connection established');
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Payment Service running on port ${PORT}`);
      console.log(`🔑 Razorpay configured: ${!!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
};

// Start the application
startServer();