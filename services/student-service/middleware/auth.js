import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access denied",
      message: "Token required"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.student = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: "Invalid token",
      message: "Token is not valid"
    });
  }
};