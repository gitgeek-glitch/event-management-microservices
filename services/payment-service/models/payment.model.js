import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "INR"
  },
  status: {
    type: String,
    enum: ["created", "pending", "paid", "failed", "refunded"],
    default: "created"
  },
  studentId: {
    type: Number,
    required: true
  },
  eventId: {
    type: String,
    required: true
  },
  registrationId: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  },
  refundId: {
    type: String,
    default: null
  },
  notes: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ studentId: 1 });
paymentSchema.index({ eventId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;