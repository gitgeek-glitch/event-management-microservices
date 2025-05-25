import express from "express";
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  getPaymentsByStudent,
  getPaymentsByEvent,
  refundPayment,
  handleWebhook
} from "../controllers/payment.controller.js";

const router = express.Router();

// Middleware to validate MongoDB ObjectId format
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    // Simple ObjectId validation (24 hex characters)
    if (id && !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ 
        error: `Invalid ${paramName} format`,
        received: id 
      });
    }
    next();
  };
};

// Middleware to validate required fields
const validateCreateOrder = (req, res, next) => {
  const { amount, studentId, eventId, registrationId } = req.body;
  
  const errors = [];
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    errors.push('amount must be a positive number');
  }
  if (!studentId) errors.push('studentId is required');
  if (!eventId) errors.push('eventId is required');
  if (!registrationId) errors.push('registrationId is required');
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors 
    });
  }
  
  next();
};

// Create payment order
router.post("/create-order", validateCreateOrder, createPaymentOrder);

// Verify payment
router.post("/verify", verifyPayment);

// Webhook endpoint (must be before parameterized routes)
router.post("/webhook", 
  express.raw({ type: 'application/json' }),
  handleWebhook
);

// Get payment details by payment ID
router.get("/:paymentId", validateObjectId('paymentId'), getPaymentDetails);

// Get payments by student ID
router.get("/student/:studentId", getPaymentsByStudent);

// Get payments by event ID  
router.get("/event/:eventId", getPaymentsByEvent);

// Refund payment
router.post("/:paymentId/refund", validateObjectId('paymentId'), refundPayment);

// Add a test route for debugging
router.get("/test/health", (req, res) => {
  res.json({ 
    message: "Payment routes are working",
    timestamp: new Date().toISOString()
  });
});

export default router;