import { Student } from "../models/student.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
    const { search } = req.query;
    const filters = {};
    
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
    const { name, usn, email, password } = req.body;

    if (!name || !usn || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Name, USN, email, and password are required"
      });
    }

    const studentData = { name, usn, email, password };
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

export const signup = async (req, res) => {
  try {
    const { name, usn, email, password } = req.body;

    if (!name || !usn || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Name, USN, email, and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Password must be at least 6 characters long"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const studentData = { name, usn, email, password: hashedPassword };
    const student = await Student.create(studentData);

    const token = jwt.sign(
      { id: student.id, usn: student.usn, email: student.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    const studentResponse = { ...student };
    delete studentResponse.password;

    res.status(201).json({
      success: true,
      data: {
        student: studentResponse,
        token
      },
      message: "Student registered successfully"
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
      error: "Registration failed",
      message: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { usn, password } = req.body;

    if (!usn || !password) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "USN and password are required"
      });
    }

    const student = await Student.findByUsn(usn);
    if (!student) {
      return res.status(401).json({
        success: false,
        error: "Authentication failed",
        message: "Invalid credentials"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Authentication failed",
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { id: student.id, usn: student.usn, email: student.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    const studentResponse = { ...student };
    delete studentResponse.password;

    res.json({
      success: true,
      data: {
        student: studentResponse,
        token
      },
      message: "Login successful"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Login failed",
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

export const getStudentByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Invalid email"
      });
    }
    
    const student = await Student.findByEmail(email);

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

export const getStudentByUsn = async (req, res) => {
  try {
    const { usn } = req.params;
    
    if (!usn || typeof usn !== 'string' || usn.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Invalid USN"
      });
    }
    
    const student = await Student.findByUsn(usn);

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

    delete updateData.id;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID"
      });
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
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
    
    await Student.deleteById(id);

    res.json({
      success: true,
      message: "Student deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Error deleting student",
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

export const authenticateStudent = async (req, res) => {
  try {
    const { usn, password } = req.body;

    if (!usn || !password) {
      return res.status(400).json({
        success: false,
        error: "USN and password are required"
      });
    }

    const student = await Student.authenticate(usn, password);

    if (!student) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    res.json({
      success: true,
      data: student,
      message: "Authentication successful"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Authentication failed",
      message: error.message
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const studentId = req.student.id;
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    const studentResponse = { ...student };
    delete studentResponse.password;

    res.json({
      success: true,
      data: studentResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching profile",
      message: error.message
    });
  }
};