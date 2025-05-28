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
        participants_id: [99999],
        event_id: 'TEST_EVENT',
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
      .contains("participants_id", [parseInt(participantId)])
      .order('id', { ascending: false });

    if (error) throw error;
    return data.map(registration => new Registration(registration));
  }

  static async findByEventId(eventId) {
    const { data, error } = await supabase
      .from("registration-service")
      .select("*")
      .eq("event_id", eventId)
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

  static async updateById(id, updateData) {
    const cleanData = {};
    
    // Handle participants_id array
    if (updateData.participants_id !== undefined) {
      if (Array.isArray(updateData.participants_id)) {
        cleanData.participants_id = updateData.participants_id.map(id => Number(id));
        if (cleanData.participants_id.some(id => isNaN(id))) {
          throw new Error('All participant IDs must be valid numbers');
        }
      } else if (updateData.participants_id !== null) {
        throw new Error('participants_id must be an array');
      }
    }
    
    // Handle event_id as string
    if (updateData.event_id !== undefined && updateData.event_id !== null) {
      cleanData.event_id = String(updateData.event_id).trim();
    }
    
    // Handle team_leader_id as number
    if (updateData.team_leader_id !== undefined && updateData.team_leader_id !== null) {
      const numericValue = Number(updateData.team_leader_id);
      if (!isNaN(numericValue)) {
        cleanData.team_leader_id = numericValue;
      }
    }
    
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
      .eq("event_id", eventId);

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