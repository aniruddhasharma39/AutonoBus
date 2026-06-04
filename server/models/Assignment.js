import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Pricing' }, // Was Pricing, we can keep the field name 'schedule' but ref 'Pricing' (or rename to pricing)
  pricing: { type: mongoose.Schema.Types.ObjectId, ref: 'Pricing' }, // Better to add 'pricing'
  busType: { type: String, required: true }, // Defines the required layout for this assignment
  totalSeats: { type: Number, required: true }, // 30, 36, or 42
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' }, // Optional until assigned by Admin
  journeyDate: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], default: 'scheduled' },
  bookedSeats: [{
    seatNumber: { type: String, required: true },
    status: { type: String, enum: ['locked', 'booked'], default: 'booked' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    passengerName: { type: String },
    gender: { type: String },
    age: { type: Number },
    boardingPoint: { type: String },
    droppingPoint: { type: String }
  }]
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
