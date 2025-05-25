import { supabase } from "../config/db.js";

// GET /api/students
export const getAllStudents = async (req, res) => {
  const { data, error } = await supabase.from("students").select("*");

  if (error) return res.status(500).json({ error: "Error fetching students" });
  res.json(data);
};

// POST /api/students
export const createStudent = async (req, res) => {
  const { name, department } = req.body;

  if (!name || !department) {
    return res.status(400).json({ error: "Name and department are required" });
  }

  const { data, error } = await supabase.from("students").insert([{ name, department }]);

  if (error) return res.status(400).json({ error: "Error creating student" });
  res.status(201).json(data[0]);
};
