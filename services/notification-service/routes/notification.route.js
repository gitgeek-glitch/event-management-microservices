import express from "express";
import {
  sendNotification,
  updateNotificationStatus,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/send", sendNotification);
router.put("/status/:id", updateNotificationStatus);

export default router;
