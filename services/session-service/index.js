import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import sessionRoutes from "./routes/session.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/sessions", sessionRoutes);
app.get("/health", (req, res) => res.send("Session Service is healthy"));

const PORT = process.env.PORT || 3004;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Session Service running on port ${PORT}`));
});
