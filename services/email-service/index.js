import express from "express";
import dotenv from "dotenv";
import emailRoutes from "./routes/email.routes.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use("/api/email", emailRoutes);

app.get("/health", (req, res) => res.send("📧 Email Service is healthy"));

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`Email Service running on port ${PORT}`);
});
