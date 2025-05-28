import { supabase } from "../config/db.js";

export class Student {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.usn = data.usn;
    this.email = data.email;
    this.password = data.password;
  }

  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from("student-service")
        .select("count", { count: 'exact', head: true });
      
      return !error;
    } catch (err) {
      return false;
    }
  }

  static async create(studentData) {
    try {
      const cleanData = {};
      
      if (studentData.name) {
        cleanData.name = String(studentData.name).trim();
      }
      if (studentData.usn) {
        cleanData.usn = String(studentData.usn).trim().toUpperCase();
      }
      if (studentData.email) {
        cleanData.email = String(studentData.email).trim().toLowerCase();
      }
      if (studentData.password) {
        cleanData.password = String(studentData.password);
      }

      if (!cleanData.name || !cleanData.usn || !cleanData.email || !cleanData.password) {
        throw new Error('name, usn, email, and password are required fields');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanData.email)) {
        throw new Error('Invalid email format');
      }

      const { data, error } = await supabase
        .from("student-service")
        .insert([cleanData])
        .select()
        .single();

      if (error) {
        let errorMessage = 'Database error';
        if (error.code === '23505') {
          if (error.message.includes('usn')) {
            errorMessage = 'USN already exists';
          } else if (error.message.includes('email')) {
            errorMessage = 'Email already exists';
          } else {
            errorMessage = 'Student already exists';
          }
        } else if (error.code === '23514') {
          errorMessage = 'Data validation failed - check field formats';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(`${errorMessage}: ${error.details || error.hint || 'No additional details'}`);
      }

      return new Student(data);
    } catch (err) {
      throw err;
    }
  }

  static async findAll(filters = {}) {
    let query = supabase
      .from("student-service")
      .select("*");

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,usn.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    query = query.order('id', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data.map(student => new Student(student));
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from("student-service")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data ? new Student(data) : null;
  }

  static async findByUsn(usn) {
    const { data, error } = await supabase
      .from("student-service")
      .select("*")
      .eq("usn", String(usn).trim().toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data ? new Student(data) : null;
  }

  static async findByEmail(email) {
    const { data, error } = await supabase
      .from("student-service")
      .select("*")
      .eq("email", String(email).trim().toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data ? new Student(data) : null;
  }

  static async updateById(id, updateData) {
    const cleanData = {};
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'usn') {
          cleanData[key] = String(value).trim().toUpperCase();
        } else if (key === 'email') {
          cleanData[key] = String(value).trim().toLowerCase();
        } else if (typeof value === 'string') {
          cleanData[key] = value.trim();
        } else {
          cleanData[key] = value;
        }
      }
    });
    
    if (cleanData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanData.email)) {
        throw new Error('Invalid email format');
      }
    }

    const { data, error } = await supabase
      .from("student-service")
      .update(cleanData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      let errorMessage = 'Database error';
      if (error.code === '23505') {
        if (error.message.includes('usn')) {
          errorMessage = 'USN already exists';
        } else if (error.message.includes('email')) {
          errorMessage = 'Email already exists';
        }
      }
      throw new Error(`${errorMessage}: ${error.details || error.hint || 'No additional details'}`);
    }
    return new Student(data);
  }

  static async deleteById(id) {
    const { error } = await supabase
      .from("student-service")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }

  static async searchStudents(searchTerm) {
    const { data, error } = await supabase
      .from("student-service")
      .select("*")
      .or(`name.ilike.%${searchTerm}%,usn.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data.map(student => new Student(student));
  }

  static async getStudentStats() {
    try {
      const { count: totalCount, error: totalError } = await supabase
        .from("student-service")
        .select("*", { count: 'exact', head: true });

      if (totalError) throw totalError;

      return {
        total: totalCount
      };
    } catch (error) {
      throw error;
    }
  }

  static async authenticate(usn, password) {
    try {
      const { data, error } = await supabase
        .from("student-service")
        .select("*")
        .eq("usn", String(usn).trim().toUpperCase())
        .eq("password", password)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data ? new Student(data) : null;
    } catch (error) {
      throw error;
    }
  }
}