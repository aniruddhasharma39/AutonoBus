import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  pnr: { type: String, required: true, unique: true },
  seats: [{
    seatNumber: { type: String, required: true },
    passengerName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  boardingPoint: { type: String, required: true },
  droppingPoint: { type: String, required: true },
  appliedOfferCode: { type: String },
  discountAmount: { type: Number, default: 0 },
  paymentIntentId: { type: String } // For future Stripe/Razorpay integration
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
