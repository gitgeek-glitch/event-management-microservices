import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import registrationRoutes from "./routes/registration.routes.js";

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',  // Vite default dev server
    'http://localhost:3000',  // React dev server
    'http://localhost:3001',  // Additional frontend port
    'http://127.0.0.1:5173',  // Alternative localhost format
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Routes
app.use("/api/registrations", registrationRoutes);

app.get("/health", (req, res) => res.send("Registration Service is healthy"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Registration Service API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      registrations: "/api/registrations",
      test: "/api/registrations/test"
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'development' ? err.message : "Something went wrong"
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 3003;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Registration Service running on port ${PORT}`));
});