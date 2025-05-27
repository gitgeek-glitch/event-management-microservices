import express from "express";
import {
  testConnection,
  getAllStudents,
  createStudent,
  getStudentById,
  getStudentByStudentId,
  updateStudent,
  deleteStudent,
  hardDeleteStudent,
  getStudentsByDepartment,
  getStudentsByYear,
  searchStudents,
  getStudentStats
} from "../controllers/student.controller.js";

const router = express.Router();

// Test connection
router.get("/test", testConnection);

// Student statistics
router.get("/stats", getStudentStats);

// Search students
router.get("/search", searchStudents);

// Get all students with optional filters
router.get("/", getAllStudents);

// Create new student
router.post("/", createStudent);

// Get students by department
router.get("/department/:department", getStudentsByDepartment);

// Get students by year
router.get("/year/:year", getStudentsByYear);

// Get student by database ID
router.get("/id/:id", getStudentById);

// Get student by student ID (unique identifier)
router.get("/:student_id", getStudentByStudentId);

// Update student by database ID
router.put("/:id", updateStudent);

// Soft delete student (deactivate)
router.delete("/:id", deleteStudent);

// Hard delete student (permanent removal)
router.delete("/:id/permanent", hardDeleteStudent);

export default router;