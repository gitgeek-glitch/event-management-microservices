import express from "express";
import dotenv from "dotenv";
import notificationRoutes from "./routes/notification.route.js";

dotenv.config();
const app = express();
app.use(express.json());

app.use("/api/notifications", notificationRoutes);

app.get("/health", (req, res) => res.send("Notification Service is healthy"));

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => console.log(`🚀 Notification Service running on port ${PORT}`));
