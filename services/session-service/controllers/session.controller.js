import Session from "../models/session.model.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL;

export const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find();

    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        try {
          const response = await axios.get(`${EVENT_SERVICE_URL}/${session.eventId}`);
          const event = response.data;

          return {
            ...session.toObject(),
            eventTitle: event.title,
            eventType: event.type
          };
        } catch (err) {
          // If event not found, return session without enrichment
          return {
            ...session.toObject(),
            eventTitle: "Unknown Event",
            eventType: "Unknown"
          };
        }
      })
    );

    res.json(enrichedSessions);
  } catch (error) {
    res.status(500).json({ error: "Error fetching sessions" });
  }
};

export const createSession = async (req, res) => {
  try {
    const newSession = new Session(req.body);
    const saved = await newSession.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: "Invalid session data" });
  }
};
