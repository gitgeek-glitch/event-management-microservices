import { supabase } from "../config/db.js";

// GET /api/registrations
export const getAllRegistrations = async (req, res) => {
  const { data, error } = await supabase.from("registrations").select("*");

  if (error) return res.status(500).json({ error: "Error fetching registrations" });
  res.json(data);
};

// POST /api/registrations
export const createRegistration = async (req, res) => {
  const { event_id, status, payment_status, team_name, emergency_contact } = req.body;

  if (!event_id || !status) {
    return res.status(400).json({ error: "Event ID and status are required" });
  }

  const { data, error } = await supabase.from("registrations").insert([{ 
    event_id, 
    status, 
    payment_status: payment_status || 'pending',
    team_name,
    emergency_contact
  }]);

  if (error) return res.status(400).json({ error: "Error creating registration" });
  res.status(201).json(data[0]);
};

// GET /api/registrations/:id
export const getRegistrationById = async (req, res) => {
  const { id } = req.params;
  
  const { data, error } = await supabase.from("registrations").select("*").eq("id", id).single();

  if (error) return res.status(404).json({ error: "Registration not found" });
  res.json(data);
};

// DELETE /api/registrations/:id
export const deleteRegistration = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("registrations").delete().eq("id", id);

  if (error) return res.status(400).json({ error: "Error deleting registration" });
  res.json({ message: "Registration deleted successfully" });
};