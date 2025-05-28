import express from "express";
import {
  testConnection,
  getAllStudents,
  createStudent,
  getStudentById,
  getStudentByEmail,
  getStudentByUsn,
  updateStudent,
  deleteStudent,
  searchStudents,
  getStudentStats,
  authenticateStudent
} from "../controllers/student.controller.js";

const router = express.Router();

router.get("/test", testConnection);
router.get("/stats", getStudentStats);
router.get("/search", searchStudents);
router.get("/", getAllStudents);
router.get("/id/:id", getStudentById);
router.get("/email/:email", getStudentByEmail);
router.get("/usn/:usn", getStudentByUsn);

router.post("/", createStudent);
router.post("/auth", authenticateStudent);

router.put("/:id", updateStudent);

router.delete("/:id", deleteStudent);

export default router;