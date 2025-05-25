import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/payment.model.js";
import dotenv from "dotenv";
import winston from "winston";

dotenv.config();

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'payment-service' },
  transports: [
    // Write errors to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Initialize Razorpay with proper error handling
let razorpay;

const initializeRazorpay = () => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not found in environment variables');
    }

    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    logger.info('Razorpay initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Razorpay', { error: error.message });
    return false;
  }
};

// Initialize Razorpay
const isRazorpayInitialized = initializeRazorpay();

// Utility function to generate unique order ID
const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `order_${timestamp}_${random}`;
};

// Create payment order
export const createPaymentOrder = async (req, res) => {
  try {
    if (!isRazorpayInitialized) {
      logger.error('Payment service not properly configured');
      return res.status(500).json({ 
        error: "Payment service not properly configured" 
      });
    }

    const { amount, studentId, eventId, registrationId, notes = {} } = req.body;

    logger.info('Creating payment order', { 
      amount, 
      studentId, 
      eventId, 
      registrationId 
    });

    // Generate unique order ID
    const orderId = generateOrderId();

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise and ensure integer
      currency: "INR",
      receipt: orderId,
      notes: {
        studentId: String(studentId),
        eventId: String(eventId),
        registrationId: String(registrationId),
        ...notes
      }
    });

    logger.info('Razorpay order created', { 
      razorpayOrderId: razorpayOrder.id,
      orderId 
    });

    // Save payment record to database
    const payment = new Payment({
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: Number(amount),
      studentId: String(studentId),
      eventId: String(eventId),
      registrationId: String(registrationId),
      status: "created",
      notes: notes || {}
    });

    const savedPayment = await payment.save();
    logger.info('Payment record saved', { 
      paymentId: savedPayment._id,
      razorpayOrderId: razorpayOrder.id 
    });

    res.status(201).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: savedPayment._id
    });

  } catch (error) {
    logger.error('Create payment order error', { 
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ 
      error: "Failed to create payment order",
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    logger.info('Verifying payment', { 
      razorpay_order_id, 
      razorpay_payment_id 
    });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      logger.warn('Missing payment verification data', {
        razorpay_order_id: !!razorpay_order_id,
        razorpay_payment_id: !!razorpay_payment_id,
        razorpay_signature: !!razorpay_signature
      });
      return res.status(400).json({ 
        error: "Missing payment verification data",
        required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']
      });
    }

    // Find payment record
    const payment = await Payment.findOne({ 
      razorpayOrderId: razorpay_order_id 
    });

    if (!payment) {
      logger.warn('Payment record not found', { razorpay_order_id });
      return res.status(404).json({ error: "Payment record not found" });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      logger.error('Payment signature verification failed', {
        razorpay_order_id,
        razorpay_payment_id
      });
      
      // Update payment status to failed
      payment.status = "failed";
      payment.failureReason = "Invalid signature";
      await payment.save();

      return res.status(400).json({ 
        error: "Payment verification failed",
        verified: false 
      });
    }

    // Update payment record with success
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "paid";
    const updatedPayment = await payment.save();

    logger.info('Payment verified successfully', { 
      paymentId: updatedPayment._id,
      razorpay_order_id,
      razorpay_payment_id
    });

    res.json({
      success: true,
      verified: true,
      paymentId: updatedPayment._id,
      message: "Payment verified successfully"
    });

  } catch (error) {
    logger.error('Payment verification error', { 
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ 
      error: "Payment verification failed",
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get payment details
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    logger.info('Fetching payment details', { paymentId });

    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      logger.warn('Payment not found', { paymentId });
      return res.status(404).json({ error: "Payment not found" });
    }

    logger.info('Payment details retrieved successfully', { paymentId });

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    logger.error('Get payment details error', { 
      paymentId: req.params.paymentId,
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ 
      error: "Failed to fetch payment details",
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get payments by student
export const getPaymentsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    logger.info('Fetching payments for student', { 
      studentId, 
      status, 
      page, 
      limit 
    });

    const query = { studentId: String(studentId) };
    if (status) {
      query.status = status;
    }

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 items per page

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNumber)
      .skip((pageNumber - 1) * limitNumber)
      .lean(); // Use lean for better performance

    const total = await Payment.countDocuments(query);

    logger.info('Payments retrieved for student', { 
      studentId, 
      count: payments.length, 
      total,
      page: pageNumber
    });

    res.json({
      success: true,
      payments,
      pagination: {
        totalPages: Math.ceil(total / limitNumber),
        currentPage: pageNumber,
        limit: limitNumber,
        total
      }
    });
  } catch (error) {
    logger.error('Get payments by student error', { 
      studentId: req.params.studentId,
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ 
      error: "Failed to fetch payments",
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get payments by event
export const getPaymentsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    logger.info('Fetching payments for event', { 
      eventId, 
      status, 
      page, 
      limit 
    });

    const query = { eventId: String(eventId) };
    if (status) {
      query.status = status;
    }

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit)));

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNumber)
      .skip((pageNumber - 1) * limitNumber)
      .lean();

    const total = await Payment.countDocuments(query);

    logger.info('Payments retrieved for event', { 
      eventId, 
      count: payments.length, 
      total,
      page: pageNumber
    });

    res.json({
      success: true,
      payments,
      pagination: {
        totalPages: Math.ceil(total / limitNumber),
        currentPage: pageNumber,
        limit: limitNumber,
        total
      }
    });
  } catch (error) {
    logger.error('Get payments by event error', { 
      eventId: req.params.eventId,
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ 
      error: "Failed to fetch payments",
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Refund payment
export const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason = "Requested by user" } = req.body;

    logger.info('Processing refund for payment', { 
      paymentId, 
      amount, 
      reason 
    });

    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      logger.warn('Payment not found for refund', { paymentId });
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.status !== "paid") {
      logger.warn('Invalid payment status for refund', { 
        paymentId, 
        currentStatus: payment.status 
      });
      return res.status(400).json({ 
        error: "Only paid payments can be refunded",
        currentStatus: payment.status
      });
    }

    if (!payment.razorpayPaymentId) {
      logger.error('Missing Razorpay payment ID for refund', { paymentId });
      return res.status(400).json({ 
        error: "Payment ID not found for refund processing" 
      });
    }

    // Calculate refund amount
    const refundAmount = amount ? Math.min(amount, payment.amount) : payment.amount;

    // Create refund with Razorpay
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(refundAmount * 100), // Convert to paise
      notes: {
        reason: String(reason),
        refund_date: new Date().toISOString(),
        original_amount: payment.amount
      }
    });

    // Update payment record
    payment.status = "refunded";
    payment.refundId = refund.id;
    payment.failureReason = String(reason);
    await payment.save();

    logger.info('Refund processed successfully', { 
      paymentId, 
      refundId: refund.id, 
      refundAmount: refund.amount / 100 
    });

    res.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100, // Convert back to rupees
      status: refund.status,
      message: "Refund processed successfully"
    });

  } catch (error) {
    logger.error('Refund payment error', { 
      paymentId: req.params.paymentId,
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ 
      error: "Failed to process refund",
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Webhook handler
export const handleWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    logger.info('Webhook received', { 
      event: req.body?.event,
      hasSignature: !!webhookSignature
    });

    // Skip signature verification in development mode if no webhook secret
    if (process.env.NODE_ENV !== 'development' || webhookSecret) {
      if (!webhookSignature) {
        logger.warn('Missing webhook signature');
        return res.status(400).json({ error: 'Missing webhook signature' });
      }

      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (webhookSignature !== expectedSignature) {
        logger.error('Invalid webhook signature');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const { event, payload } = req.body;

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
      case 'refund.processed':
        await handleRefundProcessed(payload.refund.entity);
        break;
      default:
        logger.info('Unhandled webhook event', { event });
    }

    logger.info('Webhook processed successfully', { event });
    res.json({ success: true, event });
  } catch (error) {
    logger.error('Webhook handler error', { 
      error: error.message,
      stack: error.stack,
      event: req.body?.event
    });
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper functions for webhook events
const handlePaymentCaptured = async (paymentData) => {
  try {
    const payment = await Payment.findOne({ 
      razorpayOrderId: paymentData.order_id 
    });
    
    if (payment && payment.status !== 'paid') {
      payment.status = 'paid';
      payment.razorpayPaymentId = paymentData.id;
      payment.paymentMethod = paymentData.method;
      await payment.save();
      logger.info('Payment captured via webhook', { 
        paymentId: payment._id,
        razorpayPaymentId: paymentData.id
      });
    }
  } catch (error) {
    logger.error('Handle payment captured error', { 
      error: error.message,
      paymentDataId: paymentData?.id
    });
  }
};

const handlePaymentFailed = async (paymentData) => {
  try {
    const payment = await Payment.findOne({ 
      razorpayOrderId: paymentData.order_id 
    });
    
    if (payment && payment.status !== 'failed') {
      payment.status = 'failed';
      payment.failureReason = paymentData.error_description || 'Payment failed';
      await payment.save();
      logger.warn('Payment failed via webhook', { 
        paymentId: payment._id,
        razorpayPaymentId: paymentData.id,
        reason: paymentData.error_description
      });
    }
  } catch (error) {
    logger.error('Handle payment failed error', { 
      error: error.message,
      paymentDataId: paymentData?.id
    });
  }
};

const handleRefundProcessed = async (refundData) => {
  try {
    const payment = await Payment.findOne({ 
      razorpayPaymentId: refundData.payment_id 
    });
    
    if (payment && payment.status !== 'refunded') {
      payment.status = 'refunded';
      payment.refundId = refundData.id;
      await payment.save();
      logger.info('Refund processed via webhook', { 
        paymentId: payment._id,
        refundId: refundData.id
      });
    }
  } catch (error) {
    logger.error('Handle refund processed error', { 
      error: error.message,
      refundDataId: refundData?.id
    });
  }
};