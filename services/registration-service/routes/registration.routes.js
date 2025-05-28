import express from "express";
import {
  testConnection,
  getAllRegistrations,
  createRegistration,
  getRegistrationById,
  updateRegistration,
  deleteRegistration,
  getEventRegistrationCount,
  createBulkRegistrations,
  getRegistrationsByTeam,
  deleteMultipleRegistrations
} from "../controllers/registration.controller.js";

const router = express.Router();

router.get("/test", testConnection);
router.get("/", getAllRegistrations);
router.post("/", createRegistration);
router.get("/:id", getRegistrationById);
router.put("/:id", updateRegistration);
router.delete("/:id", deleteRegistration);
router.get("/event/:event_id/count", getEventRegistrationCount);
router.post("/bulk", createBulkRegistrations);
router.get("/team/:team_name", getRegistrationsByTeam);
router.delete("/bulk", deleteMultipleRegistrations);

export default router;