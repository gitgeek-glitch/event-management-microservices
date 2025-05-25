import express from "express";
import { 
  getAllRegistrations, 
  createRegistration, 
  getRegistrationById, 
  deleteRegistration 
} from "../controllers/registration.controller.js";

const router = express.Router();

router.get("/", getAllRegistrations);
router.post("/", createRegistration);
router.get("/:id", getRegistrationById);
router.delete("/:id", deleteRegistration);

export default router;