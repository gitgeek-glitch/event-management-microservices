import express from "express";
import { getAllSessions, createSession } from "../controllers/session.controller.js";

const router = express.Router();

router.get("/", getAllSessions);
router.post("/", createSession);

export default router;
