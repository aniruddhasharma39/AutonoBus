import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  bannerImageUrl: { type: String },
  isFirstJourneyOnly: { type: Boolean, default: false },
  applicableRoutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }],
  discountType: { type: String, enum: ['fixed', 'percentage'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  termsAndConditions: { type: String },
  isActive: { type: Boolean, default: true },
  usedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;
