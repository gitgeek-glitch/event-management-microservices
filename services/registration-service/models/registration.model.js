import { supabase } from "../config/db.js";

export class Registration {
  constructor(data) {
    this.id = data.id;
    this.participants_id = data.participants_id;
    this.event_id = data.event_id;
    this.team_name = data.team_name;
    this.payment_id = data.payment_id;
    this.team_leader_id = data.team_leader_id;
  }

  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from("registration-service")
        .select("count", { count: 'exact', head: true });
      
      if (error) return false;
      
      const { data: schemaData, error: schemaError } = await supabase
        .from("registration-service")
        .select("*")
        .limit(1);
        
      if (schemaError) return false;
      return true;
    } catch (err) {
      return false;
    }
  }

  static async create(registrationData) {
    try {
      const cleanData = {};

      // participants_id as array of numbers (student IDs)
      if (
        Array.isArray(registrationData.participants_id) &&
        registrationData.participants_id.length > 0
      ) {
        cleanData.participants_id = registrationData.participants_id.map(id => Number(id));
        // Validate all IDs are numbers
        if (cleanData.participants_id.some(id => isNaN(id))) {
          throw new Error('All participant IDs must be valid numbers');
        }
      } else {
        throw new Error('participants_id must be a non-empty array');
      }

      // event_id as string
      if (registrationData.event_id !== undefined && registrationData.event_id !== null) {
        cleanData.event_id = String(registrationData.event_id).trim();
      }

      const intFields = ['team_leader_id'];
      intFields.forEach(field => {
        if (registrationData[field] !== undefined && registrationData[field] !== null) {
          const numericValue = Number(registrationData[field]);
          if (!isNaN(numericValue)) {
            cleanData[field] = numericValue;
          }
        }
      });

      const textFields = ['team_name', 'payment_id'];
      textFields.forEach(field => {
        if (registrationData[field] !== undefined && registrationData[field] !== null) {
          const value = String(registrationData[field]).trim();
          if (value !== '') {
            cleanData[field] = value;
          }
        }
      });

      if (!cleanData.participants_id || !cleanData.event_id) {
        throw new Error('participants_id and event_id are required fields');
      }

      // Validate all students
      for (const studentId of cleanData.participants_id) {
        await this.validateStudent(studentId);
      }

      if (cleanData.team_leader_id) {
        await this.validateStudent(cleanData.team_leader_id);
      }

      const { data, error } = await supabase
        .from("registration-service")
        .insert([cleanData])
        .select()
        .single();

      if (error) {
        let errorMessage = 'Database error';
        if (error.code === '23505') {
          errorMessage = 'Registration already exists';
        } else if (error.code === '23503') {
          errorMessage = 'Referenced student or event does not exist';
        } else if (error.code === '23514') {
          errorMessage = 'Data validation failed';
        } else if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(`${errorMessage}: ${error.details || 'No additional details'}`);
      }

      if (!data) {
        throw new Error('No data returned from database');
      }

      return new Registration(data);
    } catch (err) {
      throw err;
    }
  }

  static async validateStudent(studentId) {
    try {
      const response = await fetch(`http://student-service:3002/api/students/${studentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Student with ID ${studentId} does not exist`);
        }
        throw new Error(`Failed to validate student ${studentId}`);
      }
      return true;
    } catch (error) {
      if (error.message.includes('does not exist')) {
        throw error;
      }
      return true;
    }
  }

  static async getTableInfo() {
    try {
      const { data, error } = await supabase
        .from("registration-service")
        .select("*")
        .limit(0);
        
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  static async testInsert() {
    try {
      const testData = {
        participants_id: 99999,
        event_id: 99999,
        team_name: 'TEST_TEAM'
      };

      const { data, error } = await supabase
        .from("registration-service")
        .insert([testData])
        .select()
        .single();

      if (data && data.id) {
        await supabase
          .from("registration-service")
          .delete()
          .eq("id", data.id);
      }

      return { success: !error, error, data };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  static async findAll() {
    const { data, error } = await supabase
      .from("registration-service")
      .select("*")
      .order('id', { ascending: false });

    if (error) throw error;
    return data.map(registration => new Registration(registration));
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from("registration-service")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data ? new Registration(data) : null;
  }

  static async findByParticipantId(participantId) {
    const { data, error } = await supabase
      .from("registration-service")
      .select("*")
      .eq("participants_id", participantId)
      .order('id', { ascending: false });

    if (error) throw error;
    return data.map(registration => new Registration(registration));
  }

  static async findByEventId(eventId) {
    const { data, error } = await supabase
      .from("registration-service")
      .select("*")
      .eq("event_id", eventId) // eventId is string
      .order('id', { ascending: false });

    if (error) throw error;
    return data.map(registration => new Registration(registration));
  }

  static async findByTeamLeaderId(teamLeaderId) {
    const { data, error } = await supabase
      .from("registration-service")
      .select("*")
      .eq("team_leader_id", teamLeaderId)
      .order('id', { ascending: false });

    if (error) throw error;
    return data.map(registration => new Registration(registration));
  }

  static async findByTeamName(teamName) {
    const { data, error } = await supabase
      .from("registration-service")
      .select("*")
      .eq("team_name", teamName)
      .order('id', { ascending: false });

    if (error) throw error;
    return data.map(registration => new Registration(registration));
  }

  static async isParticipantRegistered(participantId, eventId) {
    const { data, error } = await supabase
      .from("registration-service")
      .select("id")
      .eq("participants_id", participantId)
      .eq("event_id", eventId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return !!data;
  }

  static async getTeamMembers(eventId, teamName) {
    const { data, error } = await supabase
      .from("registration-service")
      .select("*")
      .eq("event_id", eventId)
      .eq("team_name", teamName)
      .order('id', { ascending: true });

    if (error) throw error;
    return data.map(registration => new Registration(registration));
  }

  static async createMultiple(registrationsData) {
    try {
      const cleanedData = [];
      
      for (const registrationData of registrationsData) {
        const cleanData = {};
        
        const intFields = ['participants_id', 'team_leader_id'];
        intFields.forEach(field => {
          if (registrationData[field] !== undefined && registrationData[field] !== null) {
            const numericValue = Number(registrationData[field]);
            if (!isNaN(numericValue)) {
              cleanData[field] = numericValue;
            }
          }
        });
        
        // event_id as string
        if (registrationData.event_id !== undefined && registrationData.event_id !== null) {
          cleanData.event_id = String(registrationData.event_id).trim();
        }

        const textFields = ['team_name', 'payment_id'];
        textFields.forEach(field => {
          if (registrationData[field] !== undefined && registrationData[field] !== null) {
            const value = String(registrationData[field]).trim();
            if (value !== '') {
              cleanData[field] = value;
            }
          }
        });

        if (!cleanData.participants_id || !cleanData.event_id) {
          throw new Error('participants_id and event_id are required fields for all registrations');
        }

        await this.validateStudent(cleanData.participants_id);
        
        if (cleanData.team_leader_id) {
          await this.validateStudent(cleanData.team_leader_id);
        }

        cleanedData.push(cleanData);
      }

      const { data, error } = await supabase
        .from("registration-service")
        .insert(cleanedData)
        .select();

      if (error) {
        let errorMessage = 'Database error';
        if (error.code === '23505') {
          errorMessage = 'One or more registrations already exist';
        } else if (error.code === '23503') {
          errorMessage = 'One or more referenced students or events do not exist';
        } else if (error.code === '23514') {
          errorMessage = 'Data validation failed';
        } else if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(`${errorMessage}: ${error.details || 'No additional details'}`);
      }

      return data.map(registration => new Registration(registration));
    } catch (err) {
      throw err;
    }
  }

  static async updateMultiple(updates) {
    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        if (!update.id) {
          throw new Error('Registration ID is required for update');
        }
        
        const registration = await this.updateById(update.id, update.data);
        results.push(registration);
      } catch (error) {
        errors.push({
          id: update.id,
          error: error.message
        });
      }
    }

    return {
      successful: results,
      failed: errors
    };
  }

  static async deleteMultiple(ids) {
    const results = [];
    const errors = [];

    for (const id of ids) {
      try {
        await this.deleteById(id);
        results.push(id);
      } catch (error) {
        errors.push({
          id: id,
          error: error.message
        });
      }
    }

    return {
      deleted: results,
      failed: errors
    };
  }

  static async updateById(id, updateData) {
    const cleanData = {};
    
    const intFields = ['participants_id', 'event_id', 'team_leader_id'];
    intFields.forEach(field => {
      if (updateData[field] !== undefined && updateData[field] !== null) {
        const numericValue = Number(updateData[field]);
        if (!isNaN(numericValue)) {
          cleanData[field] = numericValue;
        }
      }
    });
    
    const textFields = ['team_name', 'payment_id'];
    textFields.forEach(field => {
      if (updateData[field] !== undefined && updateData[field] !== null && updateData[field] !== '') {
        cleanData[field] = String(updateData[field]).trim();
      }
    });

    const { data, error } = await supabase
      .from("registration-service")
      .update(cleanData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return new Registration(data);
  }

  static async deleteById(id) {
    const { error } = await supabase
      .from("registration-service")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }

  static async countByEventId(eventId) {
    const { count, error } = await supabase
      .from("registration-service")
      .select("*", { count: 'exact', head: true })
      .eq("event_id", eventId); // eventId is string

    if (error) throw error;
    return count;
  }

  static async getRegistrationStats() {
    try {
      const { count: totalCount, error: totalError } = await supabase
        .from("registration-service")
        .select("*", { count: 'exact', head: true });

      if (totalError) throw totalError;

      const { data: eventStats, error: eventError } = await supabase
        .from("registration-service")
        .select("event_id")
        .order("event_id");

      if (eventError) throw eventError;

      const eventCounts = {};
      eventStats.forEach(reg => {
        eventCounts[reg.event_id] = (eventCounts[reg.event_id] || 0) + 1;
      });

      const { data: teamStats, error: teamError } = await supabase
        .from("registration-service")
        .select("team_name")
        .not("team_name", "is", null);

      if (teamError) throw teamError;

      const teamCounts = {};
      teamStats.forEach(reg => {
        if (reg.team_name) {
          teamCounts[reg.team_name] = (teamCounts[reg.team_name] || 0) + 1;
        }
      });

      return {
        total_registrations: totalCount,
        registrations_by_event: eventCounts,
        team_registrations: teamCounts,
        total_teams: Object.keys(teamCounts).length
      };
    } catch (error) {
      throw error;
    }
  }
}