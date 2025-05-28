import express from "express";
import { createSession, getSessionByEventId } from "../controllers/session.controller.js";

const router = express.Router();

router.post("/", createSession);
router.get("/event/:eventId", getSessionByEventId);

export default router;
