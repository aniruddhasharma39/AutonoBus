import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true, default: 'AC Sleeper' },
  totalSeats: { type: Number, required: true },
  amenities: [{ type: String }],
  // A simple representation of seat layout: 1A, 1B, 2A, 2B, etc.
  layout: [{
    seatNumber: { type: String, required: true },
    type: { type: String, enum: ['sleeper', 'seater'], default: 'sleeper' },
    status: { type: String, enum: ['available', 'maintenance'], default: 'available' }
  }],
  serviceImage: { type: String, default: '' },
  themeColor: { type: String, default: '#0B3D91' },
  images: {
    front: { type: String, default: '' },
    right: { type: String, default: '' },
    left: { type: String, default: '' },
    back: { type: String, default: '' }
  }
}, { timestamps: true });

const Bus = mongoose.model('Bus', busSchema);
export default Bus;
