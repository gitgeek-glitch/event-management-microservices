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
      participants_ids,
      event_id,
      team_name,
      payment_id,
      team_leader_id
    } = req.body;

    let participantIds = [];
    
    if (participants_ids && Array.isArray(participants_ids)) {
      participantIds = participants_ids;
    } else if (participants_id) {
      participantIds = [participants_id];
    } else {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Either participants_id or participants_ids array is required"
      });
    }

    if (participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "At least one participant ID is required"
      });
    }

    if (!event_id) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Event ID is required"
      });
    }

    if (isNaN(Number(event_id))) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Event ID must be a valid number"
      });
    }

    for (const pid of participantIds) {
      if (isNaN(Number(pid))) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          message: `Participant ID ${pid} must be a valid number`
        });
      }
    }

    if (team_leader_id && isNaN(Number(team_leader_id))) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Team Leader ID must be a valid number"
      });
    }

    const baseRegistrationData = {
      event_id: Number(event_id)
    };

    if (team_name && typeof team_name === 'string' && team_name.trim()) {
      baseRegistrationData.team_name = team_name.trim();
    }

    if (payment_id && typeof payment_id === 'string' && payment_id.trim()) {
      baseRegistrationData.payment_id = payment_id.trim();
    }

    if (team_leader_id) {
      baseRegistrationData.team_leader_id = Number(team_leader_id);
    }

    const createdRegistrations = [];
    const errors = [];

    for (const participantId of participantIds) {
      try {
        const registrationData = {
          ...baseRegistrationData,
          participants_id: Number(participantId)
        };

        const registration = await Registration.create(registrationData);
        createdRegistrations.push(registration);
      } catch (error) {
        errors.push({
          participant_id: participantId,
          error: error.message
        });
      }
    }

    if (createdRegistrations.length === 0) {
      return res.status(400).json({
        success: false,
        error: "All registrations failed",
        errors: errors,
        message: "No registrations were created"
      });
    } else if (errors.length > 0) {
      return res.status(207).json({
        success: true,
        partial: true,
        data: createdRegistrations,
        errors: errors,
        message: `${createdRegistrations.length} of ${participantIds.length} registrations created successfully`
      });
    } else {
      return res.status(201).json({
        success: true,
        data: createdRegistrations,
        count: createdRegistrations.length,
        message: participantIds.length === 1 
          ? "Registration created successfully" 
          : `${participantIds.length} registrations created successfully`
      });
    }

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
    
    if (!event_id || isNaN(parseInt(event_id))) {
      return res.status(400).json({
        success: false,
        error: "Invalid event ID"
      });
    }
    
    const count = await Registration.countByEventId(parseInt(event_id));

    res.json({
      success: true,
      event_id: parseInt(event_id),
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

export const createBulkRegistrations = async (req, res) => {
  try {
    const { registrations } = req.body;

    if (!Array.isArray(registrations) || registrations.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "registrations array is required and must not be empty"
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < registrations.length; i++) {
      const regData = registrations[i];
      try {
        if (!regData.participants_id || !regData.event_id) {
          throw new Error(`Registration ${i}: participants_id and event_id are required`);
        }

        const registration = await Registration.create(regData);
        results.push({
          index: i,
          registration: registration
        });
      } catch (error) {
        errors.push({
          index: i,
          data: regData,
          error: error.message
        });
      }
    }

    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        error: "All bulk registrations failed",
        errors: errors
      });
    }

    res.status(errors.length > 0 ? 207 : 201).json({
      success: true,
      partial: errors.length > 0,
      data: results.map(r => r.registration),
      successful_count: results.length,
      failed_count: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${results.length} of ${registrations.length} registrations created successfully`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Bulk registration failed",
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

export const deleteMultipleRegistrations = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Registration IDs array is required"
      });
    }

    const results = [];
    const errors = [];

    for (const id of ids) {
      try {
        if (isNaN(parseInt(id))) {
          throw new Error(`Invalid registration ID: ${id}`);
        }
        
        await Registration.deleteById(id);
        results.push(id);
      } catch (error) {
        errors.push({
          id: id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      deleted_count: results.length,
      failed_count: errors.length,
      deleted_ids: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `${results.length} of ${ids.length} registrations deleted successfully`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Bulk deletion failed",
      message: error.message
    });
  }
};