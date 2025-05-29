import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true
  },
  winner: {
    type: Number,
    required: true
  },
  scores: [
    {
      registrationId: {
        type: Number,
        required: true
      },
      remarks: {
        type: String,
        required: true
      }
    }
  ],
  eventRemarks: {
    type: String,
    required: true
  },
});

const Session = mongoose.model("Session", sessionSchema);
export default Session;
