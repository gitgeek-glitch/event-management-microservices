import { supabase } from "../config/db.js";

export class Registration {
  constructor(data) {
    this.id = data.id;
    this.student_id = data.student_id;
    this.event_id = data.event_id;
    this.session_ids = data.session_ids;
    this.registration_date = data.registration_date || new Date().toISOString();
    this.status = data.status || 'pending';
    this.payment_status = data.payment_status || 'pending';
    this.team_name = data.team_name;
    this.team_member1_id = data.team_member1_id;
    this.team_member2_id = data.team_member2_id;
    this.team_member3_id = data.team_member3_id;
    this.team_member4_id = data.team_member4_id;
    this.emergency_contact = data.emergency_contact;
    this.dietary_requirements = data.dietary_requirements;
    this.special_needs = data.special_needs;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  get team_member_ids() {
    return [this.team_member1_id, this.team_member2_id, this.team_member3_id, this.team_member4_id]
      .filter(memberId => memberId && memberId.trim() !== '');
  }

  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from("registrations")
        .select("count", { count: 'exact', head: true });
      
      if (error) {
        return false;
      }
      
      const { data: schemaData, error: schemaError } = await supabase
        .from("registrations")
        .select("*")
        .limit(1);
        
      if (schemaError) {
        return false;
      }
      
      return true;
    } catch (err) {
      return false;
    }
  }

  static async create(registrationData) {
    try {
      const cleanData = {};
      
      // Handle text fields (student_id, event_id, session_ids are now text)
      const textFields = [
        'student_id', 'event_id', 'session_ids', 'status', 'payment_status', 
        'team_name', 'team_member1_id', 'team_member2_id', 'team_member3_id', 
        'team_member4_id', 'dietary_requirements', 'special_needs'
      ];
      
      textFields.forEach(field => {
        if (registrationData[field] !== undefined && registrationData[field] !== null) {
          const value = String(registrationData[field]).trim();
          if (value !== '') {
            cleanData[field] = value;
          }
        }
      });
      
      // Handle numeric field (emergency_contact is now numeric)
      if (registrationData.emergency_contact !== undefined && registrationData.emergency_contact !== null) {
        const numericValue = Number(registrationData.emergency_contact);
        if (!isNaN(numericValue)) {
          cleanData.emergency_contact = numericValue;
        }
      }
      
      // Set defaults
      cleanData.status = cleanData.status || 'pending';
      cleanData.payment_status = cleanData.payment_status || 'pending';

      if (!cleanData.student_id || !cleanData.event_id) {
        throw new Error('student_id and event_id are required fields');
      }

      // Validate student exists by calling student service
      await this.validateStudent(cleanData.student_id);

      // Validate team member students exist if provided
      const teamMemberIds = [
        cleanData.team_member1_id,
        cleanData.team_member2_id,
        cleanData.team_member3_id,
        cleanData.team_member4_id
      ].filter(id => id && id.trim() !== '');

      for (const memberId of teamMemberIds) {
        await this.validateStudent(memberId);
      }

      const { data, error } = await supabase
        .from("registrations")
        .insert([cleanData])
        .select()
        .single();

      if (error) {
        if (!error.message && !error.code && !error.details) {
          try {
            const { data: tableInfo, error: tableError } = await supabase
              .from("registrations")
              .select("*")
              .limit(0);
            
            if (tableError) {
              throw new Error(`Table access error: ${tableError.message || 'Unknown table error'}`);
            }
          } catch (tableErr) {
            throw new Error(`Database connection or table structure issue: ${tableErr.message}`);
          }
          
          throw new Error('Unknown database error - empty error response from Supabase');
        }
        
        let errorMessage = 'Database error';
        if (error.code === '23505') {
          errorMessage = 'Registration already exists for this student and event';
        } else if (error.code === '23503') {
          errorMessage = 'Referenced student or event does not exist';
        } else if (error.code === '23514') {
          errorMessage = 'Data validation failed - check field formats';
        } else if (error.code === '42703') {
          errorMessage = 'Database column does not exist - schema mismatch';
        } else if (error.code === '22P02') {
          errorMessage = 'Invalid data type provided';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(`${errorMessage}: ${error.details || error.hint || 'No additional details'}`);
      }

      if (!data) {
        throw new Error('No data returned from database - insertion may have failed');
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
      // If student service is down, log warning but don't fail registration
      console.warn(`Student service unavailable for validation: ${error.message}`);
      return true;
    }
  }

  static async getTableInfo() {
    try {
      const { data, error } = await supabase
        .from("registrations")
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
        student_id: "TEST_99999",
        event_id: "99999", // Now text instead of integer
        status: 'pending',
        payment_status: 'pending'
      };

      const { data, error } = await supabase
        .from("registrations")
        .insert([testData])
        .select()
        .single();

      if (data && data.id) {
        await supabase
          .from("registrations")
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
      .from("registrations")
      .select("*")
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(registration => new Registration(registration));
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from("registrations")
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

  static async findByStudentId(studentId) {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("student_id", String(studentId).trim())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(registration => new Registration(registration));
  }

  static async findByEventId(eventId) {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", String(eventId).trim()) // Now treat as text
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(registration => new Registration(registration));
  }

  static async updateById(id, updateData) {
    const cleanData = {};
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'emergency_contact') {
          // emergency_contact is numeric
          const numericValue = Number(value);
          if (!isNaN(numericValue)) {
            cleanData[key] = numericValue;
          }
        } else {
          // All other fields are text
          cleanData[key] = String(value).trim();
        }
      }
    });
    
    cleanData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("registrations")
      .update(cleanData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return new Registration(data);
  }

  static async deleteById(id) {
    const { error } = await supabase
      .from("registrations")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }

  static async countByEventId(eventId) {
    const { count, error } = await supabase
      .from("registrations")
      .select("*", { count: 'exact', head: true })
      .eq("event_id", String(eventId).trim()) // Now treat as text
      .eq("status", "confirmed");

    if (error) throw error;
    return count;
  }

  static async updatePaymentStatus(id, paymentStatus, transactionId = null) {
    const updateData = { 
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };
    
    if (transactionId) {
      updateData.transaction_id = transactionId;
    }

    const { data, error } = await supabase
      .from("registrations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return new Registration(data);
  }
}