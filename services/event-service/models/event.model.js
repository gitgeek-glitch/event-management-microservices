import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: {
    type: String,
    enum: ["Hackathon", "Workshop", "Webinar", "Competition"],
  },
  venue: String,
  schedule: Date,
  capacity: Number,
  eligibility: String,
});

const Event = mongoose.model("Event", eventSchema);
export default Event;
