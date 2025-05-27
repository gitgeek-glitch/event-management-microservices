import { supabase } from "../config/db.js";

export class Student {
  constructor(data) {
    this.id = data.id;
    this.student_id = data.student_id; // Unique string identifier
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.department = data.department;
    this.year = data.year;
    this.skills = data.skills;
    this.interests = data.interests;
    this.emergency_contact_name = data.emergency_contact_name;
    this.emergency_contact_phone = data.emergency_contact_phone;
    this.dietary_requirements = data.dietary_requirements;
    this.special_needs = data.special_needs;
    this.profile_picture = data.profile_picture;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("count", { count: 'exact', head: true });
      
      return !error;
    } catch (err) {
      return false;
    }
  }

  static async create(studentData) {
    try {
      const cleanData = {};
      
      // Required fields
      if (studentData.student_id) {
        cleanData.student_id = String(studentData.student_id).trim().toUpperCase();
      }
      if (studentData.name) {
        cleanData.name = String(studentData.name).trim();
      }
      if (studentData.email) {
        cleanData.email = String(studentData.email).trim().toLowerCase();
      }
      if (studentData.department) {
        cleanData.department = String(studentData.department).trim();
      }

      // Optional fields
      if (studentData.phone) {
        cleanData.phone = String(studentData.phone).trim();
      }
      if (studentData.year && !isNaN(parseInt(studentData.year))) {
        cleanData.year = parseInt(studentData.year);
      }
      if (studentData.skills && Array.isArray(studentData.skills)) {
        cleanData.skills = studentData.skills;
      } else if (studentData.skills && typeof studentData.skills === 'string') {
        cleanData.skills = studentData.skills.split(',').map(skill => skill.trim());
      }
      if (studentData.interests && Array.isArray(studentData.interests)) {
        cleanData.interests = studentData.interests;
      } else if (studentData.interests && typeof studentData.interests === 'string') {
        cleanData.interests = studentData.interests.split(',').map(interest => interest.trim());
      }
      if (studentData.emergency_contact_name) {
        cleanData.emergency_contact_name = String(studentData.emergency_contact_name).trim();
      }
      if (studentData.emergency_contact_phone) {
        cleanData.emergency_contact_phone = String(studentData.emergency_contact_phone).trim();
      }
      if (studentData.dietary_requirements) {
        cleanData.dietary_requirements = String(studentData.dietary_requirements).trim();
      }
      if (studentData.special_needs) {
        cleanData.special_needs = String(studentData.special_needs).trim();
      }
      if (studentData.profile_picture) {
        cleanData.profile_picture = String(studentData.profile_picture).trim();
      }
      if (studentData.is_active !== undefined) {
        cleanData.is_active = Boolean(studentData.is_active);
      }

      // Validate required fields
      if (!cleanData.student_id || !cleanData.name || !cleanData.email || !cleanData.department) {
        throw new Error('student_id, name, email, and department are required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanData.email)) {
        throw new Error('Invalid email format');
      }

      const { data, error } = await supabase
        .from("students")
        .insert([cleanData])
        .select()
        .single();

      if (error) {
        let errorMessage = 'Database error';
        if (error.code === '23505') {
          if (error.message.includes('student_id')) {
            errorMessage = 'Student ID already exists';
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
      .from("students")
      .select("*")
      .eq("is_active", true);

    // Apply filters
    if (filters.department) {
      query = query.eq("department", filters.department);
    }
    if (filters.year) {
      query = query.eq("year", parseInt(filters.year));
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,student_id.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data.map(student => new Student(student));
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from("students")
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

  static async updateById(id, updateData) {
    const cleanData = {};
    
    // Handle updates for each field
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'student_id') {
          cleanData[key] = String(value).trim().toUpperCase();
        } else if (key === 'email') {
          cleanData[key] = String(value).trim().toLowerCase();
        } else if (key === 'year') {
          cleanData[key] = parseInt(value);
        } else if ((key === 'skills' || key === 'interests') && Array.isArray(value)) {
          cleanData[key] = value;
        } else if ((key === 'skills' || key === 'interests') && typeof value === 'string') {
          cleanData[key] = value.split(',').map(item => item.trim());
        } else if (key === 'is_active') {
          cleanData[key] = Boolean(value);
        } else if (typeof value === 'string') {
          cleanData[key] = value.trim();
        } else {
          cleanData[key] = value;
        }
      }
    });
    
    // Validate email format if being updated
    if (cleanData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanData.email)) {
        throw new Error('Invalid email format');
      }
    }
    
    cleanData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("students")
      .update(cleanData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      let errorMessage = 'Database error';
      if (error.code === '23505') {
        if (error.message.includes('student_id')) {
          errorMessage = 'Student ID already exists';
        } else if (error.message.includes('email')) {
          errorMessage = 'Email already exists';
        }
      }
      throw new Error(`${errorMessage}: ${error.details || error.hint || 'No additional details'}`);
    }
    return new Student(data);
  }

  static async deleteById(id) {
    // Soft delete by setting is_active to false
    const { data, error } = await supabase
      .from("students")
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return new Student(data);
  }

  static async hardDeleteById(id) {
    // Hard delete - actually remove from database
    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }

  static async findByDepartment(department) {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("department", department)
      .eq("is_active", true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data.map(student => new Student(student));
  }

  static async findByYear(year) {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("year", parseInt(year))
      .eq("is_active", true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data.map(student => new Student(student));
  }

  static async searchStudents(searchTerm) {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .or(`name.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .eq("is_active", true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data.map(student => new Student(student));
  }

  static async getStudentStats() {
    try {
      // Total students
      const { count: totalCount, error: totalError } = await supabase
        .from("students")
        .select("*", { count: 'exact', head: true })
        .eq("is_active", true);

      if (totalError) throw totalError;

      // Students by department
      const { data: deptData, error: deptError } = await supabase
        .from("students")
        .select("department")
        .eq("is_active", true);

      if (deptError) throw deptError;

      const departmentCounts = deptData.reduce((acc, student) => {
        acc[student.department] = (acc[student.department] || 0) + 1;
        return acc;
      }, {});

      // Students by year
      const { data: yearData, error: yearError } = await supabase
        .from("students")
        .select("year")
        .eq("is_active", true)
        .not("year", "is", null);

      if (yearError) throw yearError;

      const yearCounts = yearData.reduce((acc, student) => {
        acc[student.year] = (acc[student.year] || 0) + 1;
        return acc;
      }, {});

      return {
        total: totalCount,
        byDepartment: departmentCounts,
        byYear: yearCounts
      };
    } catch (error) {
      throw error;
    }
  }

  static async findByStudentId(studentId) {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("student_id", String(studentId).trim().toUpperCase())
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
      .from("students")
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
}