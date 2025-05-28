import Event from "../models/event.model.js";

export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Error fetching events" });
  }
};

export const createEvent = async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    const saved = await newEvent.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: "Invalid event data" });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    res.status(400).json({ error: "Invalid event ID" });
  }
};
