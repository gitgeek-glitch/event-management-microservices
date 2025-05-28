import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  eventId: {
    type: String, 
    required: true
  },
  registerationId: {
    type: Number, 
    required: true
  },
  winner: {
    type: String,
    required: true
  },
  score: Number,
  remarks: String,
  date: {
    type: Date,
    default: Date.now
  }
});

const Session = mongoose.model("Session", sessionSchema);
export default Session;
