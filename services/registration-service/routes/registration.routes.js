import express from "express";
import {
  testConnection,
  getAllRegistrations,
  createRegistration,
  getRegistrationById,
  updateRegistration,
  deleteRegistration,
  confirmRegistration,
  cancelRegistration,
  updatePaymentStatus,
  getEventRegistrationCount
} from "../controllers/registration.controller.js";

const router = express.Router();

router.get("/test", testConnection);
router.get("/", getAllRegistrations);
router.post("/", createRegistration);
router.get("/:id", getRegistrationById);
router.put("/:id", updateRegistration);
router.delete("/:id", deleteRegistration);

router.patch("/:id/confirm", confirmRegistration);
router.patch("/:id/cancel", cancelRegistration);
router.patch("/:id/payment", updatePaymentStatus);

router.get("/event/:event_id/count", getEventRegistrationCount);

export default router;