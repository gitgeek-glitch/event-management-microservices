import express from "express";
import { sendEventEmail } from "../controllers/email.controller.js";

const router = express.Router();

router.post("/send", sendEventEmail);

export default router;
