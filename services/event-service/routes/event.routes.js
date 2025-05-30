import express from "express";
import { getAllEvents, createEvent, getEventById } from "../controllers/event.controller.js";

const router = express.Router();

router.get("/", getAllEvents);
router.post("/", createEvent);
router.get("/:id", getEventById);

export default router;