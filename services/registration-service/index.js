import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import registrationRoutes from "./routes/registration.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

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
  console.error(err.stack);
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