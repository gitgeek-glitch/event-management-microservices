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
    const { participants_id, event_id, team_leader_id } = req.query;
    let registrations;

    if (participants_id) {
      registrations = await Registration.findByParticipantId(participants_id);
    } else if (event_id) {
      registrations = await Registration.findByEventId(event_id);
    } else if (team_leader_id) {
      registrations = await Registration.findByTeamLeaderId(team_leader_id);
    } else {
      registrations = await Registration.findAll();
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
      participants_id,
      event_id,
      team_name,
      payment_id,
      team_leader_id
    } = req.body;

    let participantIds = [];

    if (Array.isArray(participants_id)) {
      participantIds = participants_id.map(id => Number(id));
    } else if (participants_id) {
      participantIds = [Number(participants_id)];
    } else {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "participants_id is required (can be a number or array of numbers)"
      });
    }

    // Add team_leader_id if provided and not already in the array
    if (team_leader_id && !participantIds.includes(Number(team_leader_id))) {
      participantIds.push(Number(team_leader_id));
    }

    // Validate all IDs are numbers
    if (participantIds.some(id => isNaN(id))) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "All participant IDs must be valid numbers"
      });
    }

    if (!event_id || typeof event_id !== 'string' || !event_id.trim()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Event ID is required and must be a non-empty string"
      });
    }

    const registrationData = {
      event_id: event_id,
      participants_id: participantIds,
      team_name,
      payment_id,
      team_leader_id: team_leader_id ? Number(team_leader_id) : undefined
    };

    const registration = await Registration.create(registrationData);

    return res.status(201).json({
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
    } else if (error.message.includes('Database error')) {
      statusCode = 500;
    }

    res.status(statusCode).json({
      success: false,
      error: "Registration creation failed",
      message: error.message
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

export const getEventRegistrationCount = async (req, res) => {
  try {
    const { event_id } = req.params;
    
    if (!event_id || typeof event_id !== 'string' || !event_id.trim()) {
      return res.status(400).json({
        success: false,
        error: "Invalid event ID"
      });
    }
    
    const count = await Registration.countByEventId(event_id);

    res.json({
      success: true,
      event_id: event_id,
      registration_count: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching registration count",
      message: error.message
    });
  }
};

export const getRegistrationsByTeam = async (req, res) => {
  try {
    const { team_name } = req.params;
    
    if (!team_name || team_name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Invalid team name"
      });
    }
    
    const registrations = await Registration.findByTeamName(team_name);

    res.json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching team registrations",
      message: error.message
    });
  }
};