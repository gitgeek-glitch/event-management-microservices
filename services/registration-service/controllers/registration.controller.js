import { Registration } from "../models/registration.model.js";

export const testConnection = async (req, res) => {
  try {
    const isConnected = await Registration.testConnection();
    const tableInfo = await Registration.getTableInfo();
    const testInsert = await Registration.testInsert();
    
    res.json({
      success: isConnected,
      message: isConnected ? "Database connection successful" : "Database connection failed",
      tableInfo: tableInfo,
      testInsert: testInsert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Connection test failed",
      message: error.message
    });
  }
};

export const getAllRegistrations = async (req, res) => {
  try {
    const { student_id, event_id, status } = req.query;
    let registrations;

    if (student_id) {
      registrations = await Registration.findByStudentId(student_id);
    } else if (event_id) {
      registrations = await Registration.findByEventId(event_id);
    } else {
      registrations = await Registration.findAll();
    }

    if (status) {
      registrations = registrations.filter(reg => reg.status === status);
    }

    res.json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching registrations",
      message: error.message
    });
  }
};

export const createRegistration = async (req, res) => {
  try {
    const {
      student_id,
      event_id,
      session_ids,
      team_name,
      team_member1_id,
      team_member2_id,
      team_member3_id,
      team_member4_id,
      emergency_contact,
      dietary_requirements,
      special_needs
    } = req.body;

    if (!student_id || !event_id) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Student ID and Event ID are required"
      });
    }

    // Validate student_id is string
    if (typeof student_id !== 'string' || student_id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Student ID must be a valid string"
      });
    }

    // event_id is now text, so validate as string
    if (typeof event_id !== 'string' || event_id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Event ID must be a valid string"
      });
    }

    // session_ids is now text, so validate as string if provided
    if (session_ids && (typeof session_ids !== 'string' || session_ids.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Session IDs must be a valid string"
      });
    }

    // emergency_contact is numeric, so validate as number if provided
    if (emergency_contact && isNaN(Number(emergency_contact))) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Emergency contact must be a valid number"
      });
    }

    const registrationData = {
      student_id: student_id.trim(),
      event_id: event_id.trim(),
      status: 'pending',
      payment_status: 'pending'
    };

    // Add optional text fields
    if (session_ids && typeof session_ids === 'string' && session_ids.trim()) {
      registrationData.session_ids = session_ids.trim();
    }
    if (team_name && typeof team_name === 'string' && team_name.trim()) {
      registrationData.team_name = team_name.trim();
    }
    if (team_member1_id && typeof team_member1_id === 'string' && team_member1_id.trim()) {
      registrationData.team_member1_id = team_member1_id.trim();
    }
    if (team_member2_id && typeof team_member2_id === 'string' && team_member2_id.trim()) {
      registrationData.team_member2_id = team_member2_id.trim();
    }
    if (team_member3_id && typeof team_member3_id === 'string' && team_member3_id.trim()) {
      registrationData.team_member3_id = team_member3_id.trim();
    }
    if (team_member4_id && typeof team_member4_id === 'string' && team_member4_id.trim()) {
      registrationData.team_member4_id = team_member4_id.trim();
    }
    if (dietary_requirements && typeof dietary_requirements === 'string' && dietary_requirements.trim()) {
      registrationData.dietary_requirements = dietary_requirements.trim();
    }
    if (special_needs && typeof special_needs === 'string' && special_needs.trim()) {
      registrationData.special_needs = special_needs.trim();
    }

    // Add numeric field
    if (emergency_contact && !isNaN(Number(emergency_contact))) {
      registrationData.emergency_contact = Number(emergency_contact);
    }

    const registration = await Registration.create(registrationData);

    res.status(201).json({
      success: true,
      data: registration,
      message: "Registration created successfully"
    });
  } catch (error) {
    let statusCode = 400;
    if (error.message.includes('already exists')) {
      statusCode = 409;
    } else if (error.message.includes('does not exist')) {
      statusCode = 422;
    } else if (error.message.includes('Database error') || error.message.includes('Unknown database error')) {
      statusCode = 500;
    }
    
    res.status(statusCode).json({
      success: false,
      error: "Registration creation failed",
      message: error.message,
      details: error.details || null
    });
  }
};

export const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: "Invalid registration ID"
      });
    }
    
    const registration = await Registration.findById(id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: "Registration not found"
      });
    }

    res.json({
      success: true,
      data: registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching registration",
      message: error.message
    });
  }
};

export const updateRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;
    delete updateData.registration_date;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: "Invalid registration ID"
      });
    }

    const registration = await Registration.updateById(id, updateData);

    res.json({
      success: true,
      data: registration,
      message: "Registration updated successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Error updating registration",
      message: error.message
    });
  }
};

export const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: "Invalid registration ID"
      });
    }
    
    await Registration.deleteById(id);

    res.json({
      success: true,
      message: "Registration deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Error deleting registration",
      message: error.message
    });
  }
};

export const confirmRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: "Invalid registration ID"
      });
    }
    
    const registration = await Registration.updateById(id, { status: 'confirmed' });

    res.json({
      success: true,
      data: registration,
      message: "Registration confirmed successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Error confirming registration",
      message: error.message
    });
  }
};

export const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: "Invalid registration ID"
      });
    }
    
    const registration = await Registration.updateById(id, { status: 'cancelled' });

    res.json({
      success: true,
      data: registration,
      message: "Registration cancelled successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Error cancelling registration",
      message: error.message
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: "Invalid registration ID"
      });
    }

    if (!payment_status) {
      return res.status(400).json({
        success: false,
        error: "Payment status is required"
      });
    }

    const registration = await Registration.updatePaymentStatus(id, payment_status);

    res.json({
      success: true,
      data: registration,
      message: "Payment status updated successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Error updating payment status",
      message: error.message
    });
  }
};

export const getEventRegistrationCount = async (req, res) => {
  try {
    const { event_id } = req.params;
    
    // event_id is now text, so validate as string
    if (!event_id || typeof event_id !== 'string' || event_id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Invalid event ID"
      });
    }
    
    const count = await Registration.countByEventId(event_id);

    res.json({
      success: true,
      event_id: event_id.trim(),
      confirmed_registrations: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching registration count",
      message: error.message
    });
  }
};