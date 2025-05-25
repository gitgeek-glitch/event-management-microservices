import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import registrationRoutes from "./routes/registration.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/registrations", registrationRoutes);
app.get("/health", (req, res) => res.send("Registration Service is healthy"));

const PORT = process.env.PORT || 3003;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Registration Service running on port ${PORT}`));
});