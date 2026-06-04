import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  fromDate: { type: String, required: true }, // YYYY-MM-DD
  toDate: { type: String, required: true } // YYYY-MM-DD
}, { timestamps: true });

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
