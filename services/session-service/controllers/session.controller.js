import Session from "../models/session.model.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const REGISTRATION_URL = "http://localhost:3003/api/registrations";
const STUDENT_URL = "http://localhost:3002/api/students";
const EMAIL_URL = "http://localhost:3005/api/email/send";

export const createSession = async (req, res) => {
  try {
    const newSession = new Session(req.body);
    const savedSession = await newSession.save();

    // 1. Get winner's registration
    const winnerRegistrationId = req.body.winner;
    const winnerRegistrationRes = await axios.get(`${REGISTRATION_URL}/${winnerRegistrationId}`);   

    const winnerRegistration = winnerRegistrationRes.data.data;

    // Get student details of winner
    const winnerStudentId = winnerRegistration.team_leader_id;
    const winnerStudentRes = await axios.get(`${STUDENT_URL}/id/${winnerStudentId}`);
    
    const winnerEmail = winnerStudentRes.data.data.email;

    // Send email to winner
    const emailRes = await axios.post(EMAIL_URL, {
      to: winnerEmail,
      subject: "Congratulations! You won the event",
      message: `Your team "${winnerRegistration.team_name}" has won the event!`,
      html: `<p>Your team <strong>${winnerRegistration.team_name}</strong> has won the event! 🏆</p>`,
    });
    

    // 2. Notify all participants in scores
    for (const scoreEntry of req.body.scores) {
      const registrationId = scoreEntry.registrationId;

      if (registrationId === winnerRegistrationId) continue; // skip winner

      const regRes = await axios.get(`${REGISTRATION_URL}/${registrationId}`);
      const registration = regRes.data;

      const studentId = registration.team_leader_id;

      const studentRes = await axios.get(`${STUDENT_URL}/id/${studentId}`);
      const email = studentRes.data.email;

      await axios.post(EMAIL_URL, {
        to: email,
        subject: "Event Remarks",
        message: `Remarks for your team "${registration.team_name}": ${scoreEntry.remarks}`,
        html: `<p>Remarks for your team <strong>${registration.team_name}</strong>: ${scoreEntry.remarks}</p>`,
      });
    }

    res.status(201).json(savedSession);
  } catch (error) {
    console.log(error);
    
    console.error("Error in createSession:", error.message);
    res.status(400).json({ error: "Invalid session data or internal error" });
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
