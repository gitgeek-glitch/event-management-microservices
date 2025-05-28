import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import studentRoutes from "./routes/student.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/students", studentRoutes);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Student Service is healthy",
    timestamp: new Date().toISOString(),
    service: "student-service",
    version: "1.0.0"
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Student Service API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      students: "/api/students",
      test: "/api/students/test",
      auth: "/api/students/auth"
    }
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'development' ? err.message : "Something went wrong"
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 3002;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Student Service running on port ${PORT}`);
  });
}).catch((error) => {
  console.error("Failed to connect to database:", error);
  process.exit(1);
});