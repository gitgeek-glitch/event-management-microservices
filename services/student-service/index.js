import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import studentRoutes from "./routes/student.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/students", studentRoutes);
app.get("/health", (req, res) => res.send("Student Service is healthy"));

const PORT = process.env.PORT || 3002;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Student Service running on port ${PORT}`));
});
