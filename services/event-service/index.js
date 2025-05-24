import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import eventRoutes from "./routes/event.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/events", eventRoutes);
app.get("/health", (req, res) => res.send("Event Service is healthy"));

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Event Service running on port ${PORT}`));
});
