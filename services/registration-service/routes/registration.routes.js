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
router.get("/:id", getRegistrationById);
router.get("/event/:event_id/count", getEventRegistrationCount);
router.get("/team/:team_name", getRegistrationsByTeam);

router.post("/", createRegistration);
router.post("/bulk", createBulkRegistrations);

router.put("/:id", updateRegistration);

router.delete("/bulk", deleteMultipleRegistrations);
router.delete("/:id", deleteRegistration);

export default router;