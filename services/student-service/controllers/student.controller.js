import { Student } from "../models/student.model.js";

export const testConnection = async (req, res) => {
  try {
    const isConnected = await Student.testConnection();
    
    res.json({
      success: isConnected,
      message: isConnected ? "Database connection successful" : "Database connection failed"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Connection test failed",
      message: error.message
    });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const { department, year, search } = req.query;
    const filters = {};
    
    if (department) filters.department = department;
    if (year) filters.year = year;
    if (search) filters.search = search;

    const students = await Student.findAll(filters);

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching students",
      message: error.message
    });
  }
};

export const createStudent = async (req, res) => {
  try {
    const {
      student_id,
      name,
      email,
      phone,
      department,
      year,
      skills,
      interests,
      emergency_contact_name,
      emergency_contact_phone,
      dietary_requirements,
      special_needs,
      profile_picture
    } = req.body;

    // Validation
    if (!student_id || !name || !email || !department) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Student ID, name, email, and department are required"
      });
    }

    const studentData = {
      student_id,
      name,
      email,
      department
    };

    // Add optional fields
    if (phone) studentData.phone = phone;
    if (year) studentData.year = year;
    if (skills) studentData.skills = skills;
    if (interests) studentData.interests = interests;
    if (emergency_contact_name) studentData.emergency_contact_name = emergency_contact_name;
    if (emergency_contact_phone) studentData.emergency_contact_phone = emergency_contact_phone;
    if (dietary_requirements) studentData.dietary_requirements = dietary_requirements;
    if (special_needs) studentData.special_needs = special_needs;
    if (profile_picture) studentData.profile_picture = profile_picture;

    const student = await Student.create(studentData);

    res.status(201).json({
      success: true,
      data: student,
      message: "Student created successfully"
    });
  } catch (error) {
    let statusCode = 400;
    if (error.message.includes('already exists')) {
      statusCode = 409;
    } else if (error.message.includes('Invalid email')) {
      statusCode = 422;
    }

    res.status(statusCode).json({
      success: false,
      error: "Student creation failed",
      message: error.message
    });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID"
      });
    }
    
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching student",
      message: error.message
    });
  }
};

export const getStudentByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    
    if (!student_id || typeof student_id !== 'string' || student_id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID"
      });
    }
    
    const student = await Student.findByStudentId(student_id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching student",
      message: error.message
    });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID"
      });
    }

    const student = await Student.updateById(id, updateData);

    res.json({
      success: true,
      data: student,
      message: "Student updated successfully"
    });
  } catch (error) {
    let statusCode = 400;
    if (error.message.includes('already exists')) {
      statusCode = 409;
    } else if (error.message.includes('Invalid email')) {
      statusCode = 422;
    }

    res.status(statusCode).json({
      success: false,
      error: "Error updating student",
      message: error.message
    });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID"
      });
    }
    
    const student = await Student.deleteById(id);

    res.json({
      success: true,
      data: student,
      message: "Student deactivated successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Error deleting student",
      message: error.message
    });
  }
};

export const hardDeleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID"
      });
    }
    
    await Student.hardDeleteById(id);

    res.json({
      success: true,
      message: "Student permanently deleted"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Error permanently deleting student",
      message: error.message
    });
  }
};

export const getStudentsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    
    if (!department) {
      return res.status(400).json({
        success: false,
        error: "Department is required"
      });
    }
    
    const students = await Student.findByDepartment(department);

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching students by department",
      message: error.message
    });
  }
};

export const getStudentsByYear = async (req, res) => {
  try {
    const { year } = req.params;
    
    if (!year || isNaN(parseInt(year))) {
      return res.status(400).json({
        success: false,
        error: "Valid year is required"
      });
    }
    
    const students = await Student.findByYear(year);

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching students by year",
      message: error.message
    });
  }
};

export const searchStudents = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Search query is required"
      });
    }
    
    const students = await Student.searchStudents(q.trim());

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error searching students",
      message: error.message
    });
  }
};

export const getStudentStats = async (req, res) => {
  try {
    const stats = await Student.getStudentStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching student statistics",
      message: error.message
    });
  }
};