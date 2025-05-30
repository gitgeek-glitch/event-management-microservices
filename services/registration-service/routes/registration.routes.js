import express from "express";
import {
  testConnection,
  getAllRegistrations,
  createRegistration,
  getRegistrationById,
  getRegistrationsByParticipantId,
  updateRegistration,
  deleteRegistration,
  getEventRegistrationCount,
  getRegistrationsByTeam
} from "../controllers/registration.controller.js";

const router = express.Router();

// Test route
router.get("/test", testConnection);

// Get all registrations (with optional query filters)
router.get("/", getAllRegistrations);

// Get registrations by participant ID
router.get("/participant/:participant_id", getRegistrationsByParticipantId);

// Get registration by ID
router.get("/:id", getRegistrationById);

// Get registration count for specific event
router.get("/event/:event_id/count", getEventRegistrationCount);

// Get registrations by team name
router.get("/team/:team_name", getRegistrationsByTeam);

// Create new registration
router.post("/", createRegistration);

// Update registration
router.put("/:id", updateRegistration);

// Delete registration
router.delete("/:id", deleteRegistration);

export default router;