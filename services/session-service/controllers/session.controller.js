import Session from "../models/session.model.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const createSession = async (req, res) => {
  try {
    const newSession = new Session(req.body);
    console.log("New: ", newSession);
    const saved = await newSession.save();
    console.log("Saved: ", saved);    
    res.status(201).json(saved);
  } catch (error) {
    console.log(error);
    
    res.status(400).json({ error: "Invalid session data" });
  }
};

export const getSessionByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;

    const session = await Session.findOne({ eventId });

    if (!session) {
      return res.status(404).json({ error: "Session not found for the given eventId" });
    }

    return res.json(session);

  } catch (error) {
    res.status(400).json({ error: "Invalid eventId format or request" });
  }
};
