import mongoose from 'mongoose';

const subRoutePriceSchema = new mongoose.Schema({
  source: { type: String, required: true },
  destination: { type: String, required: true },
  priceSleeper: { type: Number, required: true },
});

const dynamicPricingSchema = new mongoose.Schema({
  seatId: { type: String, required: true },
  offset: { type: Number, required: true },
});

const pricingSchema = new mongoose.Schema({
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  priceMatrix: [subRoutePriceSchema],
  dynamicPricing: [dynamicPricingSchema]
}, { timestamps: true });

const Pricing = mongoose.model('Pricing', pricingSchema);
export default Pricing;
